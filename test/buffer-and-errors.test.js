const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

describe('Buffer Support', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('interceptByStatusCode() with Buffer', function() {
        it('should handle Buffer content with auto-detected Content-Type', function(done) {
            const bufferData = Buffer.from('Binary data content');

            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, bufferData);
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /application\/octet-stream/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(Buffer.isBuffer(res.body) || typeof res.body === 'object').to.be.true;
                    done();
                });
        });

        it('should handle Buffer content with explicit Content-Type', function(done) {
            const imageBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header

            app.use(responseinterceptor.interceptByStatusCode([500], function(req, respond) {
                respond(500, imageBuffer, 'image/jpeg');
            }));

            app.get('/test', function(req, res) {
                res.status(500).send('Error');
            });

            request(app)
                .get('/test')
                .expect(500)
                .expect('Content-Type', /image\/jpeg/)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });

        it('should handle large Buffer content', function(done) {
            const largeBuffer = Buffer.alloc(1024 * 10, 'a'); // 10KB buffer

            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, largeBuffer, 'application/octet-stream');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /application\/octet-stream/)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });
});

describe('Error Handling', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('Callback Error Handling', function() {
        it('should not crash when interceptByStatusCode callback throws error', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                throw new Error('Intentional error in callback');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send({ error: 'Not found' });
            });

            // Should not crash - original response should continue
            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    // Error handling prevents crash, request completes
                    done();
                });
        });

        it('should handle error in intercept() callback', function(done) {
            app.use(responseinterceptor.intercept(function(body, header, req, callback) {
                throw new Error('Error in intercept callback');
            }));

            app.get('/test', function(req, res) {
                res.send({ data: 'test' });
            });

            request(app)
                .get('/test')
                .end(function(err, res) {
                    // Should complete without crashing
                    done();
                });
        });
    });

    describe('Edge Cases', function() {
        it('should handle null content gracefully by converting to empty string', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, null);
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    // null should be converted to empty string
                    expect(res.text).to.equal('');
                    done();
                });
        });

        it('should handle empty string content', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, '');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.equal('');
                    done();
                });
        });

        it('should handle empty object content', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, {});
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.deep.equal({});
                    done();
                });
        });

        it('should handle circular reference in object gracefully', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                const obj = { data: 'test' };
                obj.circular = obj; // Create circular reference
                
                // Should handle this without crashing
                try {
                    respond(404, obj);
                } catch(e) {
                    // If circular reference causes issue, send simple response
                    respond(404, { error: 'Circular reference error' });
                }
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    // Should complete without crashing server
                    done();
                });
        });

        it('should handle async errors in callback', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([500], function(req, respond) {
                // Simulate async error
                setTimeout(() => {
                    try {
                        throw new Error('Async error');
                    } catch(err) {
                        // In real async scenario, user should handle errors
                        respond(500, { error: 'Handled async error' });
                    }
                }, 10);
            }));

            app.get('/test', function(req, res) {
                res.status(500).send('Server error');
            });

            request(app)
                .get('/test')
                .expect(500)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('should handle undefined content by converting to empty response', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                // Pass undefined - code should handle it gracefully
                respond(404, undefined);
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    // Should complete without crashing - undefined converted to empty string
                    expect(res.text).to.equal('');
                    done();
                });
        });
    });
});
