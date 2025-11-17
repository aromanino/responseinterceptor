const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

// Helper function to parse JSON response when Content-Type is not set correctly
function parseBody(res) {
    return Object.keys(res.body).length === 0 && res.text ? JSON.parse(res.text) : res.body;
}

describe('interceptByStatusCode() - Status Code Based Interception', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('404 Not Found Interception', function() {
        it('should intercept 404 responses with custom content', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, {
                    error: 'Page not found',
                    message: 'The requested resource does not exist',
                    path: req.url
                });
            }));

            app.get('/exists', function(req, res) {
                res.json({ status: 'ok' });
            });

            // Explicitly set 404 status
            app.get('/nonexistent', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/nonexistent')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = parseBody(res);
                    expect(body).to.have.property('error', 'Page not found');
                    expect(body).to.have.property('path', '/nonexistent');
                    done();
                });
        });

        it('should not intercept successful 200 responses', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, { error: 'Not Found' });
            }));

            app.get('/test', function(req, res) {
                res.json({ status: 'success' });
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.not.have.property('error');
                    expect(res.body).to.have.property('status', 'success');
                    done();
                });
        });
    });

    describe('500 Internal Server Error Interception', function() {
        it('should intercept 500 errors with custom error page', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([500], function(req, respond) {
                respond(500, {
                    error: 'Internal Server Error',
                    message: 'Something went wrong on our end',
                    timestamp: Date.now()
                });
            }));

            app.get('/test', function(req, res) {
                res.status(500).send('Original error');
            });

            request(app)
                .get('/test')
                .expect(500)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = parseBody(res);
                    expect(body).to.have.property('error', 'Internal Server Error');
                    expect(body).to.have.property('timestamp');
                    done();
                });
        });
    });

    describe('Multiple Status Codes Interception', function() {
        it('should intercept multiple status codes (403, 404, 500)', function(done) {
            let interceptCount = 0;

            app.use(responseinterceptor.interceptByStatusCode([403, 404, 500], function(req, respond) {
                interceptCount++;
                // Get the actual status code from the context
                // Since respond() needs both status and content, we'll determine it from the route
                const statusCode = req.url === '/forbidden' ? 403 : 500;
                respond(statusCode, {
                    intercepted: true,
                    originalStatus: statusCode,
                    message: `Status ${statusCode} intercepted`
                });
            }));

            app.get('/forbidden', function(req, res) {
                res.status(403).send('Forbidden');
            });

            app.get('/error', function(req, res) {
                res.status(500).send('Error');
            });

            // Test 403
            request(app)
                .get('/forbidden')
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = parseBody(res);
                    expect(body).to.have.property('intercepted', true);
                    expect(body).to.have.property('originalStatus', 403);

                    // Test 500
                    request(app)
                        .get('/error')
                        .expect(500)
                        .end(function(err2, res2) {
                            if (err2) return done(err2);
                            const body2 = parseBody(res2);
                            expect(body2).to.have.property('intercepted', true);
                            expect(body2).to.have.property('originalStatus', 500);
                            expect(interceptCount).to.equal(2);
                            done();
                        });
                });
        });
    });

    describe('HTML Error Pages', function() {
        it('should serve custom HTML error page for 404', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, `
                    <!DOCTYPE html>
                    <html>
                    <head><title>404 Not Found</title></head>
                    <body>
                        <h1>Page Not Found</h1>
                        <p>The page ${req.url} was not found.</p>
                    </body>
                    </html>
                `);
            }));

            request(app)
                .get('/missing')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.include('<h1>Page Not Found</h1>');
                    expect(res.text).to.include('/missing');
                    done();
                });
        });
    });

    describe('Content Type Handling', function() {
        it('should handle different content types in interceptor', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                if (req.accepts('json')) {
                    respond(404, { error: 'Not Found', type: 'json' });
                } else {
                    respond(404, '<html><body>Not Found</body></html>');
                }
            }));

            app.get('/missing', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/missing')
                .set('Accept', 'application/json')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = parseBody(res);
                    expect(body).to.have.property('type', 'json');
                    done();
                });
        });
    });

    describe('Request Information in Interceptor', function() {
        it('should have access to request information', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                const responseData = {
                    error: 'Not Found',
                    requestedUrl: req.url,
                    method: req.method
                };
                // Add userAgent only if it exists (it might be undefined in test environment)
                const userAgent = req.get('User-Agent');
                if (userAgent) {
                    responseData.userAgent = userAgent;
                }
                respond(404, responseData);
            }));

            app.get('/test/path', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test/path')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = parseBody(res);
                    expect(body).to.have.property('requestedUrl', '/test/path');
                    expect(body).to.have.property('method', 'GET');
                    expect(body).to.have.property('error', 'Not Found');
                    done();
                });
        });
    });

    describe('Body Content Analysis', function() {
        it('should intercept and provide access to request information', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                const enhanced = {
                    error: 'Enhanced 404',
                    requestUrl: req.url,
                    requestMethod: req.method
                };
                respond(404, enhanced);
            }));

            app.get('/missing', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/missing')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = parseBody(res);
                    expect(body).to.have.property('error', 'Enhanced 404');
                    expect(body).to.have.property('requestUrl', '/missing');
                    done();
                });
        });
    });

    describe('Prevent Infinite Loops', function() {
        it('should not cause infinite loop when interceptor sets same status code', function(done) {
            let callCount = 0;

            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                callCount++;
                // Even if we set 404 again, it should not cause infinite recursion
                respond(404, { 
                    intercepted: true,
                    callCount: callCount 
                });
            }));

            app.get('/missing', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/missing')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
                    expect(body).to.have.property('intercepted', true);
                    // Should only be called once, not recursively
                    expect(callCount).to.equal(1);
                    done();
                });
        });
    });
});
