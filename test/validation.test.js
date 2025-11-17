const { expect } = require('chai');
const express = require('express');
const responseinterceptor = require('../index');

describe('Parameter Validation', function() {
    describe('intercept()', function() {
        it('should throw TypeError when callback is not a function', function() {
            expect(() => {
                responseinterceptor.intercept(null);
            }).to.throw(TypeError, 'callback must be a function');
        });

        it('should throw TypeError when callback is undefined', function() {
            expect(() => {
                responseinterceptor.intercept(undefined);
            }).to.throw(TypeError, 'callback must be a function');
        });

        it('should throw TypeError when callback is a string', function() {
            expect(() => {
                responseinterceptor.intercept('not a function');
            }).to.throw(TypeError, 'callback must be a function');
        });
    });

    describe('interceptOnFly()', function() {
        let app, req, res;

        beforeEach(function() {
            app = express();
            req = { get: () => null };
            res = {
                statusCode: 200,
                end: function() {},
                setHeader: function() {},
                getHeader: function() { return 'application/json'; }
            };
        });

        it('should throw TypeError when callback is not a function', function() {
            expect(() => {
                responseinterceptor.interceptOnFly(req, res, null);
            }).to.throw(TypeError, 'callback must be a function');
        });

        it('should throw TypeError when callback is undefined', function() {
            expect(() => {
                responseinterceptor.interceptOnFly(req, res, undefined);
            }).to.throw(TypeError, 'callback must be a function');
        });
    });

    describe('interceptByStatusCode()', function() {
        it('should throw TypeError when statusCodes is null', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode(null, () => {});
            }).to.throw(TypeError, 'statusCodes must be a number or an array of numbers');
        });

        it('should throw TypeError when statusCodes is undefined', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode(undefined, () => {});
            }).to.throw(TypeError, 'statusCodes must be a number or an array of numbers');
        });

        it('should throw TypeError when statusCodes is a string', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode('404', () => {});
            }).to.throw(TypeError, 'statusCodes must be a number or an array of numbers');
        });

        it('should throw TypeError when callback is not a function', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode(404, null);
            }).to.throw(TypeError, 'callback must be a function');
        });

        it('should throw TypeError when callback is undefined', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode(404, undefined);
            }).to.throw(TypeError, 'callback must be a function');
        });

        it('should accept valid number statusCode', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode(404, () => {});
            }).to.not.throw();
        });

        it('should accept valid array of statusCodes', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCode([403, 404, 500], () => {});
            }).to.not.throw();
        });
    });

    describe('interceptByStatusCodeRedirectTo()', function() {
        it('should throw TypeError when statusCodes is null', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCodeRedirectTo(null, '/error');
            }).to.throw(TypeError, 'statusCodes must be a number or an array of numbers');
        });

        it('should throw TypeError when statusCodes is undefined', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCodeRedirectTo(undefined, '/error');
            }).to.throw(TypeError, 'statusCodes must be a number or an array of numbers');
        });

        it('should throw TypeError when callback is not a function or string', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCodeRedirectTo(404, 123);
            }).to.throw(TypeError, 'callback must be a function or a string');
        });

        it('should throw TypeError when callback is null', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCodeRedirectTo(404, null);
            }).to.throw(TypeError, 'callback must be a function or a string');
        });

        it('should accept valid string callback', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCodeRedirectTo(404, '/error');
            }).to.not.throw();
        });

        it('should accept valid function callback', function() {
            expect(() => {
                responseinterceptor.interceptByStatusCodeRedirectTo(404, () => {});
            }).to.not.throw();
        });
    });
});
