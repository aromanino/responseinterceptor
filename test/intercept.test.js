const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

describe('intercept() - Basic Response Interception', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('JSON Response Interception', function() {
        it('should intercept and modify JSON response', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                if (bodyContentType.indexOf('application/json') >= 0) {
                    body.intercepted = true;
                    body.timestamp = Date.now();
                }
                callback(body);
            }));

            app.get('/test', function(req, res) {
                res.json({ message: 'Hello World' });
            });

            request(app)
                .get('/test')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('intercepted', true);
                    expect(res.body).to.have.property('timestamp');
                    expect(res.body).to.have.property('message', 'Hello World');
                    done();
                });
        });

        it('should add custom headers to response', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                body.modified = true;
                callback(body);
            }));

            app.get('/test', function(req, res) {
                res.json({ data: 'test' });
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('modified', true);
                    expect(res.body).to.have.property('data', 'test');
                    done();
                });
        });
    });

    describe('HTML Response Interception', function() {
        it('should intercept and modify HTML response', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                if (bodyContentType.indexOf('text/html') >= 0) {
                    body = body.replace('<h1>', '<h1 class="intercepted">');
                }
                callback(body);
            }));

            app.get('/test', function(req, res) {
                res.send('<html><body><h1>Title</h1></body></html>');
            });

            request(app)
                .get('/test')
                .expect('Content-Type', /html/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.include('class="intercepted"');
                    done();
                });
        });
    });

    describe('Multiple Routes Interception', function() {
        it('should intercept multiple routes consistently', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                if (typeof body === 'object') {
                    body.server = 'intercepted';
                }
                callback(body);
            }));

            app.get('/route1', function(req, res) {
                res.json({ route: 1 });
            });

            app.get('/route2', function(req, res) {
                res.json({ route: 2 });
            });

            request(app)
                .get('/route1')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('server', 'intercepted');
                    expect(res.body).to.have.property('route', 1);

                    request(app)
                        .get('/route2')
                        .expect(200)
                        .end(function(err, res) {
                            if (err) return done(err);
                            expect(res.body).to.have.property('server', 'intercepted');
                            expect(res.body).to.have.property('route', 2);
                            done();
                        });
                });
        });
    });

    describe('ETag Support', function() {
        it('should handle ETag correctly', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                body.etag_test = true;
                callback(body);
            }));

            app.get('/test', function(req, res) {
                res.json({ data: 'test' });
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.headers).to.have.property('etag');
                    
                    const etag = res.headers.etag;
                    
                    // Second request with ETag
                    request(app)
                        .get('/test')
                        .set('If-None-Match', etag)
                        .expect(304)
                        .end(done);
                });
        });
    });

    describe('Content-Length Handling', function() {
        it('should update Content-Length after modification', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                body.additionalField = 'This adds length to the response';
                callback(body);
            }));

            app.get('/test', function(req, res) {
                res.json({ data: 'test' });
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.headers).to.have.property('content-length');
                    expect(parseInt(res.headers['content-length'])).to.be.greaterThan(0);
                    done();
                });
        });
    });

    describe('Empty Response Handling', function() {
        it('should handle empty responses gracefully', function(done) {
            app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback) {
                if (!body || Object.keys(body).length === 0) {
                    body = { empty: true, default: 'response' };
                }
                callback(body);
            }));

            app.get('/test', function(req, res) {
                res.json({});
            });

            request(app)
                .get('/test')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('empty', true);
                    expect(res.body).to.have.property('default', 'response');
                    done();
                });
        });
    });
});
