const express = require('express');
const request = require('supertest');
const responseinterceptor = require('../index');

describe('Performance Benchmarks', function() {
    this.timeout(10000); // Longer timeout for performance tests

    describe('Middleware Overhead', function() {
        it('should measure intercept() overhead', function(done) {
            const app = express();
            const iterations = 1000;
            let count = 0;

            app.use(responseinterceptor.intercept(function(body, header, req, callback) {
                callback(body); // Pass through without modification
            }));

            app.get('/test', function(req, res) {
                res.json({ data: 'test' });
            });

            const startTime = Date.now();

            function makeRequest() {
                request(app)
                    .get('/test')
                    .end(function() {
                        count++;
                        if (count < iterations) {
                            setImmediate(makeRequest);
                        } else {
                            const endTime = Date.now();
                            const totalTime = endTime - startTime;
                            const avgTime = totalTime / iterations;
                            console.log(`\n      Average time per request: ${avgTime.toFixed(2)}ms`);
                            console.log(`      Total time for ${iterations} requests: ${totalTime}ms`);
                            done();
                        }
                    });
            }

            makeRequest();
        });

        it('should measure interceptByStatusCode() overhead', function(done) {
            const app = express();
            const iterations = 1000;
            let count = 0;

            app.use(responseinterceptor.interceptByStatusCode([404], function(req, respond) {
                respond(404, { error: 'Not Found' });
            }));

            app.get('/test', function(req, res) {
                res.status(404).send('Not found');
            });

            const startTime = Date.now();

            function makeRequest() {
                request(app)
                    .get('/test')
                    .end(function() {
                        count++;
                        if (count < iterations) {
                            setImmediate(makeRequest);
                        } else {
                            const endTime = Date.now();
                            const totalTime = endTime - startTime;
                            const avgTime = totalTime / iterations;
                            console.log(`\n      Average time per request: ${avgTime.toFixed(2)}ms`);
                            console.log(`      Total time for ${iterations} requests: ${totalTime}ms`);
                            done();
                        }
                    });
            }

            makeRequest();
        });

        it('should compare with no middleware baseline', function(done) {
            const app = express();
            const iterations = 1000;
            let count = 0;

            app.get('/test', function(req, res) {
                res.json({ data: 'test' });
            });

            const startTime = Date.now();

            function makeRequest() {
                request(app)
                    .get('/test')
                    .end(function() {
                        count++;
                        if (count < iterations) {
                            setImmediate(makeRequest);
                        } else {
                            const endTime = Date.now();
                            const totalTime = endTime - startTime;
                            const avgTime = totalTime / iterations;
                            console.log(`\n      Baseline average time per request: ${avgTime.toFixed(2)}ms`);
                            console.log(`      Baseline total time for ${iterations} requests: ${totalTime}ms`);
                            done();
                        }
                    });
            }

            makeRequest();
        });
    });

    describe('Content-Type Detection Performance', function() {
        it('should benchmark JSON detection', function() {
            const content = '{"key": "value", "nested": {"data": "test"}}';
            const iterations = 100000;

            const startTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                const trimmed = content.trim();
                const isJSON = (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
                               (trimmed.startsWith('[') && trimmed.endsWith(']'));
            }
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const avgTime = (totalTime / iterations) * 1000; // Convert to microseconds
            console.log(`\n      JSON detection: ${avgTime.toFixed(3)}μs per operation`);
            console.log(`      Total time for ${iterations.toLocaleString()} operations: ${totalTime}ms`);
        });

        it('should benchmark HTML detection', function() {
            const content = '<html><head></head><body><h1>Test</h1></body></html>';
            const iterations = 100000;

            const startTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                const trimmed = content.trim();
                const lowerTrimmed = trimmed.toLowerCase();
                const isHTML = trimmed.startsWith('<!DOCTYPE') || 
                              lowerTrimmed.startsWith('<!doctype') ||
                              lowerTrimmed.startsWith('<html') ||
                              (lowerTrimmed.includes('<body') && lowerTrimmed.includes('</body>')) ||
                              (lowerTrimmed.includes('<head') && lowerTrimmed.includes('</head>'));
            }
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const avgTime = (totalTime / iterations) * 1000; // Convert to microseconds
            console.log(`\n      HTML detection: ${avgTime.toFixed(3)}μs per operation`);
            console.log(`      Total time for ${iterations.toLocaleString()} operations: ${totalTime}ms`);
        });

        it('should benchmark Buffer detection', function() {
            const content = Buffer.from('test data');
            const iterations = 100000;

            const startTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                const isBuffer = Buffer.isBuffer(content);
            }
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const avgTime = (totalTime / iterations) * 1000; // Convert to microseconds
            console.log(`\n      Buffer detection: ${avgTime.toFixed(3)}μs per operation`);
            console.log(`      Total time for ${iterations.toLocaleString()} operations: ${totalTime}ms`);
        });
    });
});
