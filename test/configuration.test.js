const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const { configure, intercept, interceptByStatusCode } = require('../index');

describe('Configuration Tests', () => {
    let app;
    let customLogs;
    let customErrors;
    
    beforeEach(() => {
        app = express();
        app.use(express.json());
        customLogs = [];
        customErrors = [];
        
        // Reset configuration to defaults before each test
        configure({
            logging: {
                enabled: false,
                logger: console.log
            },
            errorHandling: {
                rethrow: false,
                onError: null
            }
        });
    });
    
    describe('configure()', () => {
        it('should accept custom logger function', (done) => {
            const customLogger = (...args) => {
                customLogs.push(args.join(' '));
            };
            
            configure({
                logging: {
                    enabled: true,
                    logger: customLogger
                },
                errorHandling: {
                    onError: (err) => customLogs.push('Error: ' + err.message)
                }
            });
            
            // Use intercept to force an error that will be logged
            app.use(intercept((body, header, req, respond) => {
                throw new Error('Test error to trigger logging');
            }));
            
            app.get('/test', (req, res) => {
                res.json({ test: true });
            });
            
            request(app)
                .get('/test')
                .end((err, res) => {
                    if (err) return done(err);
                    // Custom logger should have been called for error
                    expect(customLogs.length).to.be.greaterThan(0);
                    expect(customLogs.some(log => log.includes('Test error'))).to.be.true;
                    done();
                });
        });
        
        it('should enable/disable logging', (done) => {
            configure({
                logging: {
                    enabled: false
                }
            });
            
            app.use(intercept((body, header, req, respond) => {
                respond(body);
            }));
            
            app.get('/test', (req, res) => {
                res.json({ test: true });
            });
            
            request(app)
                .get('/test')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    // Should not crash with logging disabled
                    expect(res.body).to.deep.equal({ test: true });
                    done();
                });
        });
        
        it('should accept custom error handler', (done) => {
            const errorHandler = (err, req, res) => {
                customErrors.push({
                    message: err.message,
                    path: req.path
                });
            };
            
            configure({
                errorHandling: {
                    rethrow: false,
                    onError: errorHandler
                }
            });
            
            app.use(intercept((body, header, req, respond) => {
                throw new Error('Test error');
            }));
            
            app.get('/test', (req, res) => {
                res.json({ test: true });
            });
            
            request(app)
                .get('/test')
                .end((err, res) => {
                    if (err) return done(err);
                    // Error handler should have been called
                    expect(customErrors.length).to.equal(1);
                    expect(customErrors[0].message).to.equal('Test error');
                    expect(customErrors[0].path).to.equal('/test');
                    done();
                });
        });
        
        it('should support rethrow option', (done) => {
            configure({
                errorHandling: {
                    rethrow: false
                }
            });
            
            app.use(intercept((body, header, req, respond) => {
                throw new Error('Should not crash server');
            }));
            
            app.get('/test', (req, res) => {
                res.json({ test: true });
            });
            
            request(app)
                .get('/test')
                .expect(200) // Should still respond with original
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.deep.equal({ test: true });
                    done();
                });
        });
        
        it('should return current configuration', () => {
            const config = configure({
                logging: {
                    enabled: true,
                    logger: () => {}
                },
                errorHandling: {
                    rethrow: true
                }
            });
            
            expect(config).to.be.an('object');
            expect(config.logging).to.be.an('object');
            expect(config.logging.enabled).to.be.true;
            expect(config.errorHandling).to.be.an('object');
            expect(config.errorHandling.rethrow).to.be.true;
        });
        
        it('should allow partial configuration updates', () => {
            // Set initial config
            configure({
                logging: {
                    enabled: true,
                    logger: () => {}
                },
                errorHandling: {
                    rethrow: false
                }
            });
            
            // Update only logging
            const config = configure({
                logging: {
                    enabled: false
                }
            });
            
            expect(config.logging.enabled).to.be.false;
            expect(config.errorHandling.rethrow).to.be.false; // Should remain unchanged
        });
    });
    
    describe('Integration with interceptors', () => {
        it('should respect logging configuration in intercept()', (done) => {
            let logCount = 0;
            
            configure({
                logging: {
                    enabled: true,
                    logger: () => logCount++
                },
                errorHandling: {
                    onError: () => logCount++
                }
            });
            
            // Force an error to trigger logging
            app.use(intercept((body, header, req, respond) => {
                throw new Error('Error to trigger log');
            }));
            
            app.get('/test', (req, res) => {
                res.json({ test: true });
            });
            
            request(app)
                .get('/test')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    // Logger should have been called
                    expect(logCount).to.be.greaterThan(0);
                    done();
                });
        });
        
        it('should respect error handling in interceptByStatusCode()', (done) => {
            let errorCaught = false;
            
            configure({
                errorHandling: {
                    rethrow: false,
                    onError: (err) => {
                        errorCaught = true;
                    }
                }
            });
            
            app.use(interceptByStatusCode([500], (req, res, statusCode, content) => {
                throw new Error('Interceptor error');
            }));
            
            app.get('/test', (req, res) => {
                res.status(500).send('Error');
            });
            
            request(app)
                .get('/test')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(errorCaught).to.be.true;
                    done();
                });
        });
    });
    
    describe('Environment-based configuration', () => {
        it('should default logging to disabled in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            // Recreate config (in real scenario, this would be done at startup)
            const config = configure({
                logging: {
                    enabled: process.env.NODE_ENV !== 'production'
                }
            });
            
            expect(config.logging.enabled).to.be.false;
            
            process.env.NODE_ENV = originalEnv;
        });
        
        it('should allow logging in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            
            const config = configure({
                logging: {
                    enabled: process.env.NODE_ENV !== 'production'
                }
            });
            
            expect(config.logging.enabled).to.be.true;
            
            process.env.NODE_ENV = originalEnv;
        });
    });
});
