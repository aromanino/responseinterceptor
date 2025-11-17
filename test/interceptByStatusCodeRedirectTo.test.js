const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

describe('interceptByStatusCodeRedirectTo() - Status Code Redirect Interception', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('Static Redirect URL', function() {
        it('should redirect 404 to static error page', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], '/error/404'));

            app.get('/error/404', function(req, res) {
                res.json({ error: '404', message: 'Page not found' });
            });

            request(app)
                .get('/nonexistent')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('/error/404');
                    done();
                });
        });

        it('should redirect 500 errors to error page', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([500], '/error/500'));

            app.get('/error/500', function(req, res) {
                res.json({ error: '500', message: 'Internal server error' });
            });

            app.get('/test', function(req, res) {
                res.status(500).send('Error');
            });

            request(app)
                .get('/test')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('/error/500');
                    done();
                });
        });
    });

    describe('Dynamic Redirect with Callback', function() {
        it('should redirect using callback function', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], function(req, redirect) {
                redirect(`/error/404?path=${encodeURIComponent(req.url)}`);
            }));

            app.get('/error/404', function(req, res) {
                res.json({ 
                    error: '404', 
                    originalPath: req.query.path 
                });
            });

            request(app)
                .get('/missing/page')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.include('/error/404');
                    expect(res.header.location).to.include('path=%2Fmissing%2Fpage');
                    done();
                });
        });

        it('should use callback to determine redirect based on request', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([403], function(req, redirect) {
                // Redirect to login if not authenticated
                if (req.query.user) {
                    redirect('/error/forbidden');
                } else {
                    redirect('/login');
                }
            }));

            app.get('/login', function(req, res) {
                res.json({ message: 'Please login' });
            });

            app.get('/test', function(req, res) {
                res.status(403).send('Forbidden');
            });

            request(app)
                .get('/test')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('/login');
                    done();
                });
        });
    });

    describe('Multiple Status Codes Redirect', function() {
        it('should redirect multiple status codes to same page', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([403, 404, 500], '/error/general'));

            app.get('/error/general', function(req, res) {
                res.json({ error: 'general', message: 'An error occurred' });
            });

            app.get('/forbidden', function(req, res) {
                res.status(403).send('Forbidden');
            });

            request(app)
                .get('/forbidden')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('/error/general');
                    done();
                });
        });

        it('should redirect different status codes to different pages using callback', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([403, 404, 500], function(req, redirect) {
                // Determine redirect based on request URL
                if (req.url === '/forbidden') {
                    redirect('/error/forbidden');
                } else if (req.url === '/nonexistent') {
                    redirect('/error/notfound');
                } else {
                    redirect('/error/general');
                }
            }));

            app.get('/error/notfound', function(req, res) {
                res.json({ error: '404' });
            });

            app.get('/error/forbidden', function(req, res) {
                res.json({ error: '403' });
            });

            app.get('/forbidden', function(req, res) {
                res.status(403).send('Forbidden');
            });

            // Test 403 redirect
            request(app)
                .get('/forbidden')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('/error/forbidden');

                    // Test 404 redirect
                    request(app)
                        .get('/nonexistent')
                        .expect(302)
                        .end(function(err2, res2) {
                            if (err2) return done(err2);
                            expect(res2.header.location).to.equal('/error/notfound');
                            done();
                        });
                });
        });
    });

    describe('Preserve Request Information', function() {
        it('should preserve original URL in redirect', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], function(req, redirect) {
                redirect(`/error?url=${encodeURIComponent(req.originalUrl || req.url)}&method=${req.method}`);
            }));

            app.get('/error', function(req, res) {
                res.json({ 
                    requestedUrl: req.query.url,
                    requestedMethod: req.query.method 
                });
            });

            request(app)
                .get('/some/missing/path')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.include('url=%2Fsome%2Fmissing%2Fpath');
                    expect(res.header.location).to.include('method=GET');
                    done();
                });
        });
    });

    describe('External Redirects', function() {
        it('should support external URL redirects', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], 'https://example.com/error'));

            request(app)
                .get('/missing')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('https://example.com/error');
                    done();
                });
        });

        it('should support dynamic external redirects', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([500], function(req, redirect) {
                redirect('https://status.example.com/error?code=500');
            }));

            app.get('/test', function(req, res) {
                res.status(500).send('Error');
            });

            request(app)
                .get('/test')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('https://status.example.com/error?code=500');
                    done();
                });
        });
    });

    describe('No Redirect for Success Status', function() {
        it('should not redirect 200 responses', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], '/error'));

            app.get('/test', function(req, res) {
                res.json({ status: 'ok' });
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.be.undefined;
                    expect(res.body).to.have.property('status', 'ok');
                    done();
                });
        });
    });

    describe('Body Content in Redirect Decision', function() {
        it('should access request information when deciding redirect', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], function(req, redirect) {
                // Can analyze request to make redirect decision
                if (req.query.critical) {
                    redirect('/error/critical');
                } else {
                    redirect('/error/standard');
                }
            }));

            app.get('/error/standard', function(req, res) {
                res.json({ type: 'standard' });
            });

            request(app)
                .get('/missing')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.equal('/error/standard');
                    done();
                });
        });
    });

    describe('Query String Preservation', function() {
        it('should preserve query strings in redirect URL', function(done) {
            app.use(responseinterceptor.interceptByStatusCodeRedirectTo([404], function(req, redirect) {
                const originalQuery = new URL(req.url, 'http://localhost').search;
                redirect(`/error/404${originalQuery}`);
            }));

            app.get('/error/404', function(req, res) {
                res.json({ 
                    message: 'Not found',
                    preservedParams: req.query 
                });
            });

            request(app)
                .get('/missing?param1=value1&param2=value2')
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.header.location).to.include('param1=value1');
                    expect(res.header.location).to.include('param2=value2');
                    done();
                });
        });
    });
});
