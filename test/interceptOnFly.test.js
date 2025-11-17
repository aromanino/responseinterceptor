const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

describe('interceptOnFly() - Conditional Response Interception', function() {
    let app;

    beforeEach(function() {
        app = express();
    });

    describe('Conditional Interception', function() {
        it('should intercept response only when condition is met', function(done) {
            app.get('/test', function(req, res) {
                const shouldIntercept = req.query.intercept === 'true';
                
                if (shouldIntercept) {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        body.intercepted = true;
                        callback(body);
                    });
                }
                
                res.json({ message: 'Hello' });
            });

            // Test with interception
            request(app)
                .get('/test?intercept=true')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('intercepted', true);
                    expect(res.body).to.have.property('message', 'Hello');
                    done();
                });
        });

        it('should not intercept when condition is not met', function(done) {
            app.get('/test', function(req, res) {
                const shouldIntercept = req.query.intercept === 'true';
                
                if (shouldIntercept) {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        body.intercepted = true;
                        callback(body);
                    });
                }
                
                res.json({ message: 'Hello' });
            });

            // Test without interception
            request(app)
                .get('/test?intercept=false')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.not.have.property('intercepted');
                    expect(res.body).to.have.property('message', 'Hello');
                    done();
                });
        });
    });

    describe('User-based Interception', function() {
        it('should intercept based on user role', function(done) {
            app.get('/test', function(req, res) {
                const userRole = req.query.role;
                
                if (userRole === 'admin') {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        body.adminData = 'secret information';
                        body.role = userRole;
                        callback(body);
                    });
                }
                
                res.json({ message: 'Data' });
            });

            // Test admin user
            request(app)
                .get('/test?role=admin')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('adminData', 'secret information');
                    expect(res.body).to.have.property('role', 'admin');
                    done();
                });
        });

        it('should not add admin data for regular users', function(done) {
            app.get('/test', function(req, res) {
                const userRole = req.query.role;
                
                if (userRole === 'admin') {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        body.adminData = 'secret information';
                        callback(body);
                    });
                }
                
                res.json({ message: 'Data' });
            });

            // Test regular user
            request(app)
                .get('/test?role=user')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.not.have.property('adminData');
                    expect(res.body).to.have.property('message', 'Data');
                    done();
                });
        });
    });

    describe('Dynamic Content Modification', function() {
        it('should modify content based on request parameters', function(done) {
            app.get('/test', function(req, res) {
                const format = req.query.format;
                
                if (format === 'detailed') {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        body.details = {
                            timestamp: Date.now(),
                            requestedBy: request.ip,
                            format: format
                        };
                        callback(body);
                    });
                }
                
                res.json({ data: 'content' });
            });

            request(app)
                .get('/test?format=detailed')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('details');
                    expect(res.body.details).to.have.property('timestamp');
                    expect(res.body.details).to.have.property('format', 'detailed');
                    done();
                });
        });
    });

    describe('Multiple Conditional Checks', function() {
        it('should handle multiple conditions', function(done) {
            app.get('/test', function(req, res) {
                const debug = req.query.debug === 'true';
                const verbose = req.query.verbose === 'true';
                
                if (debug || verbose) {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        if (debug) body.debug = true;
                        if (verbose) body.verbose = true;
                        body.enhanced = true;
                        callback(body);
                    });
                }
                
                res.json({ result: 'ok' });
            });

            request(app)
                .get('/test?debug=true&verbose=true')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.body).to.have.property('debug', true);
                    expect(res.body).to.have.property('verbose', true);
                    expect(res.body).to.have.property('enhanced', true);
                    done();
                });
        });
    });

    describe('HTML Content Interception', function() {
        it('should intercept and modify HTML content conditionally', function(done) {
            app.get('/test', function(req, res) {
                const enhance = req.query.enhance === 'true';
                
                if (enhance) {
                    responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback) {
                        if (bodyContentType.indexOf('text/html') >= 0) {
                            body = body.replace('</body>', '<script>console.log("enhanced");</script></body>');
                        }
                        callback(body);
                    });
                }
                
                res.send('<html><body>Content</body></html>');
            });

            request(app)
                .get('/test?enhance=true')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    expect(res.text).to.include('<script>console.log("enhanced");</script>');
                    done();
                });
        });
    });
});
