const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

describe('interceptByStatusCode() - Enhanced Features', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('Explicit Content-Type Parameter', function() {
        it('should use explicit Content-Type when provided', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, '{"custom": "json"}', 'application/json; charset=utf-8');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /application\/json/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('custom', 'json');
                    done();
                });
        });

        it('should use explicit custom Content-Type', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, 'Plain text response', 'text/plain; charset=utf-8');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /text\/plain/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.equal('Plain text response');
                    done();
                });
        });
    });

    describe('Flexible Parameter Signatures', function() {
        it('should support respond(statusCode, content) - standard signature', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(200, { success: true, message: 'Changed to 200' });
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('message', 'Changed to 200');
                    done();
                });
        });

        it('should support respond(statusCode, content, contentType) - all three parameters', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([500], function(req, respond) {
                respond(200, 'Success after error', 'text/plain; charset=utf-8');
            }));

            app.get('/test', function(req, res) {
                res.status(500).send('Server error');
            });

            request(app)
                .get('/test')
                .expect(200)
                .expect('Content-Type', /text\/plain/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.equal('Success after error');
                    done();
                });
        });
    });

    describe('Enhanced HTML Detection', function() {
        it('should detect DOCTYPE HTML', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, '<!DOCTYPE html><html><body>HTML5</body></html>');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /text\/html/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.include('<!DOCTYPE html>');
                    done();
                });
        });

        it('should detect <html> tag (case insensitive)', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, '<HTML><BODY>Uppercase HTML</BODY></HTML>');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /text\/html/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.include('<HTML>');
                    done();
                });
        });
    });

    describe('Enhanced JSON Detection', function() {
        it('should detect complete JSON object with closing brace', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, '{"complete": "json", "closed": true}');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /application\/json/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('complete', 'json');
                    expect(res.body).to.have.property('closed', true);
                    done();
                });
        });

        it('should detect complete JSON array', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, '[1, 2, 3, 4, 5]');
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .expect('Content-Type', /application\/json/)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.be.an('array');
                    expect(res.body).to.deep.equal([1, 2, 3, 4, 5]);
                    done();
                });
        });
    });

    describe('Backward Compatibility', function() {
        it('should work with old respond(statusCode, content) signature', function(done) {
            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                // Old signature - should still work
                respond(404, { error: 'Classic approach' });
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            request(app)
                .get('/test')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error', 'Classic approach');
                    done();
                });
        });
    });
});
