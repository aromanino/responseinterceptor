
var etag = require('etag');
var propertiesmanager = require('propertiesmanager').conf;

/**
 * Global configuration for responseinterceptor
 * Uses propertiesmanager for configuration management (reads from config/default.json automatically)
 * @type {Object}
 */
const config = {
    logging: {
        enabled: propertiesmanager.responseinterceptor?.logging?.enabled !== undefined 
            ? propertiesmanager.responseinterceptor.logging.enabled 
            : process.env.NODE_ENV !== 'production',
        logger: console.log
    },
    errorHandling: {
        rethrow: propertiesmanager.responseinterceptor?.errorHandling?.rethrow !== undefined
            ? propertiesmanager.responseinterceptor.errorHandling.rethrow
            : false,
        onError: null
    }
};

/**
 * Configure global options for responseinterceptor
 * @param {Object} options - Configuration options
 * @param {Object} [options.logging] - Logging configuration
 * @param {boolean} [options.logging.enabled] - Enable/disable logging
 * @param {Function} [options.logging.logger] - Custom logger function
 * @param {Object} [options.errorHandling] - Error handling configuration
 * @param {boolean} [options.errorHandling.rethrow] - Whether to rethrow errors
 * @param {Function} [options.errorHandling.onError] - Custom error handler
 * @returns {Object} The current configuration
 * @example
 * configure({
 *   logging: { enabled: true, logger: customLogger },
 *   errorHandling: { rethrow: false, onError: (err) => console.error(err) }
 * });
 */
function configure(options) {
    if (options.logging) {
        if (typeof options.logging.enabled === 'boolean') {
            config.logging.enabled = options.logging.enabled;
        }
        if (typeof options.logging.logger === 'function') {
            config.logging.logger = options.logging.logger;
        }
    }
    
    if (options.errorHandling) {
        if (typeof options.errorHandling.rethrow === 'boolean') {
            config.errorHandling.rethrow = options.errorHandling.rethrow;
        }
        if (typeof options.errorHandling.onError === 'function') {
            config.errorHandling.onError = options.errorHandling.onError;
        }
    }
    
    return config;
}

/**
 * Get current configuration from propertiesmanager
 * @returns {Object} The current configuration
 */
function getConfig() {
    return {
        logging: {
            enabled: config.logging.enabled,
            logger: config.logging.logger
        },
        errorHandling: {
            rethrow: config.errorHandling.rethrow,
            onError: config.errorHandling.onError
        }
    };
}

/**
 * Internal logging function that respects configuration
 * @param {...any} args - Arguments to log
 */
function log(...args) {
    if (config.logging.enabled) {
        config.logging.logger(...args);
    }
}


/**
 * Helper function to determine and set appropriate Content-Type header
 * @param {*} content - The content to analyze
 * @param {object} res - Express response object
 * @param {string} [explicitContentType] - Optional explicit Content-Type to use
 */
function setContentTypeHeader(content, res, explicitContentType) {
    // If explicit Content-Type is provided, use it
    if (explicitContentType) {
        res.setHeader('Content-Type', explicitContentType);
        return;
    }

    // Auto-detect based on content type
    if (typeof content === 'object' && content !== null && !Buffer.isBuffer(content)) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (Buffer.isBuffer(content)) {
        // For Buffer, default to octet-stream unless detected otherwise
        res.setHeader('Content-Type', 'application/octet-stream');
    } else if (typeof content === 'string') {
        const trimmed = content.trim();
        const lowerTrimmed = trimmed.toLowerCase();
        
        // More robust JSON detection
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        } 
        // More specific HTML detection (avoid XML/SVG)
        else if (trimmed.startsWith('<!DOCTYPE') || 
                 lowerTrimmed.startsWith('<!doctype') ||
                 lowerTrimmed.startsWith('<html') ||
                 (lowerTrimmed.includes('<body') && lowerTrimmed.includes('</body>')) ||
                 (lowerTrimmed.includes('<head') && lowerTrimmed.includes('</head>'))) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } 
        // Default to plain text
        else {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
    } else {
        // Fallback for any other type (shouldn't happen after our undefined/null check)
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
}


function overrideEnd(req,res,callback){
    var oldEnd = res.end;
    res.end = function (chunk) {

        if(!(res.statusCode==304)){

            var header=res.getHeader('Content-Type') || "application/json; charset=utf-8";

            var body;

            if((header.indexOf('application/json')>=0)){
                try {
                    body = chunk ? JSON.parse(chunk.toString('utf8')) : {};
                }catch (ex){
                    body=chunk ? chunk.toString('utf8') : "";
                    header="text/html; charset=utf-8";
                }
            }else{
                body=chunk ? chunk.toString('utf8') : "";
            }

            try {
                callback(body, header ,req, function (modified) {

                    var neTag=etag(typeof modified == "object" ? JSON.stringify(modified).toString('utf8') : modified);
                    var oeTag=req.get('If-None-Match');
                    res.setHeader('ETag', neTag);
                    if(neTag===oeTag){
                        res.statusCode=304;
                        arguments[1] = undefined;
                        arguments[0] = '';
                    }else{
                        arguments[0] = typeof modified == "string" ? modified : JSON.stringify(modified); //JSON.stringify(body);
                        res.setHeader('Content-Length', arguments[0].length);
                        if (!chunk) {
                            // Use helper function to set Content-Type consistently
                            setContentTypeHeader(modified, res);
                            arguments[1] = undefined;
                            res.write(arguments[0]);
                        }
                    }
                    oldEnd.apply(res, arguments);
                });
            } catch (err) {
                // If callback throws an error, continue with original response to avoid crash
                log('[responseinterceptor] Error in interceptor callback:', err);
                if (config.errorHandling.onError) {
                    config.errorHandling.onError(err, req, res);
                }
                if (config.errorHandling.rethrow) {
                    throw err;
                }
                oldEnd.apply(res, [chunk]);
            }
        }else{
            oldEnd.apply(res, arguments);
        }
    };
}

// Export configuration functions
exports.configure = configure;
exports.getConfig = getConfig;

/**
 * interceptOnFly
 * --------------
 * Directly intercepts the response for a single request-response cycle without creating middleware.
 * 
 * This function overrides the response `end` method to capture and modify the response body
 * before it's sent to the client. Unlike `intercept()`, this doesn't return middleware but
 * applies the interception immediately to the current request-response pair.
 * 
 * The callback receives the parsed body, content-type header, request object, and a function
 * to send the modified response.
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {(body: any, header: string, req: Request, respond: (modified: any) => void) => void} callback
 *        A function executed when the response is about to be sent.
 *        It receives:
 *          - `body`: The parsed response body (JSON object or string)
 *          - `header`: The Content-Type header value
 *          - `req`: The Express request object
 *          - `respond(modified)`: Function to send the modified response
 * 
 * @example
 * // Intercept a single response conditionally
 * app.get('/api/data', (req, res) => {
 *   interceptOnFly(req, res, (body, header, req, respond) => {
 *     if (req.user && req.user.isAdmin) {
 *       body.adminData = { secret: 'admin-only-info' };
 *     }
 *     respond(body);
 *   });
 *   res.json({ data: 'public data' });
 * });
 */
exports.interceptOnFly=function(req,res,callback){
    if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
    }
    overrideEnd(req,res,callback);
};

/**
 * intercept
 * ---------
 * Creates Express middleware that intercepts all responses passing through it.
 * 
 * This middleware overrides the response `end` method to capture and modify response bodies
 * before they're sent to clients. The callback is executed for every response that passes
 * through this middleware.
 * 
 * The callback receives the parsed body, content-type header, request object, and a function
 * to send the modified response. It also handles ETag generation and 304 Not Modified responses.
 * 
 * @param {(body: any, header: string, req: Request, respond: (modified: any) => void) => void} callback
 *        A function executed for every intercepted response.
 *        It receives:
 *          - `body`: The parsed response body (JSON object or string)
 *          - `header`: The Content-Type header value
 *          - `req`: The Express request object
 *          - `respond(modified)`: Function to send the modified response
 * 
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Add a timestamp to all JSON responses
 * app.use(intercept((body, header, req, respond) => {
 *   if (typeof body === 'object') {
 *     body.timestamp = new Date().toISOString();
 *   }
 *   respond(body);
 * }));
 * 
 * @example
 * // Add custom headers to all responses
 * app.use(intercept((body, header, req, respond) => {
 *   respond(body);
 * }));
 * 
 * @example
 * // Filter sensitive data based on user role
 * app.use(intercept((body, header, req, respond) => {
 *   if (typeof body === 'object' && !req.user.isAdmin) {
 *     delete body.sensitiveField;
 *   }
 *   respond(body);
 * }));
 */
exports.intercept=function(callback){
    if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
    }

    return(function(req,res,next){
        overrideEnd(req,res,callback);
        next();
    });
};



/**
 * Middleware: interceptByStatusCode
 * ---------------------------------
 * Intercepts HTTP responses based on specific status codes before they are sent to the client.
 *
 * This middleware overrides `res.end()` to detect when the response status matches
 * one of the specified status codes. If a match occurs, it executes a user-defined callback
 * instead of sending the original response.
 *
 * The callback receives the `req` object and a `respond` function that can be used
 * to send a new response (e.g., render a custom error page or send a JSON message).
 *
 * To prevent infinite loops, the middleware automatically sets an internal flag
 * (`res.__interceptHandled`) so that subsequent calls to `res.send()` or `res.end()`
 * triggered inside the callback are not intercepted again.
 *
 * ---
 * @param {number|number[]} statusCodes - A single HTTP status code or an array of codes to intercept.
 * @param {(req: Request, respond: (newStatusCode: number, content: any, contentType?: string) => void) => void} callback
 *        A function executed when the response matches one of the specified status codes.
 *        It receives:
 *          - `req`: The Express request object.
 *          - `respond(newStatusCode, content, contentType?)`: A helper to send a new response.
 *            - `newStatusCode`: HTTP status code (required)
 *            - `content`: Response content - string, object, etc. (required)
 *            - `contentType`: Optional explicit Content-Type header (e.g., 'application/json; charset=utf-8')
 *                            If omitted, Content-Type is auto-detected based on content.
 *
 * @returns {Function} Express middleware function.
 *
 * @example
 * // Example 1: Basic usage with auto Content-Type detection
 * app.use(interceptByStatusCode(404, (req, respond) => {
 *   respond(404, '<h1>Page Not Found</h1>');
 * }));
 *
 * @example
 * // Example 2: Explicit Content-Type
 * app.use(interceptByStatusCode(404, (req, respond) => {
 *   respond(404, { error: 'Not Found' }, 'application/json; charset=utf-8');
 * }));
 *
 * @example
 * // Example 3: Change status code
 * app.use(interceptByStatusCode(403, (req, respond) => {
 *   respond(200, '<h1>Access Denied</h1><p>You are not authorized.</p>');
 * }));
 */

exports.interceptByStatusCode = function (statusCodes, callback) {
    // Validate parameters
    if (!statusCodes || (typeof statusCodes !== 'number' && !Array.isArray(statusCodes))) {
        throw new TypeError('statusCodes must be a number or an array of numbers');
    }
    if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
    }

    return function (req, res, next) {
        const originalEnd = res.end;

        res.end = function (...args) {
            // Prevent recursive interception (e.g. callback triggers res.send again)
            if (res.__interceptHandled) {
                return originalEnd.apply(this, args);
            }

            // Normalize statusCodes into an array of numbers
            const statusCodeList = Array.isArray(statusCodes)
                ? statusCodes
                : typeof statusCodes === 'number'
                    ? [statusCodes]
                    : [];

            // Check if current response status matches one of the target codes
            const hasStatus = statusCodeList.some(
                (status) => typeof status === 'number' && res.statusCode === status
            );

            if (hasStatus) {
                // Mark response as handled to avoid infinite loops
                res.__interceptHandled = true;

                try {
                    // Execute user callback, giving it the request and a custom responder
                    callback(req, function (newStatusCode, content, contentType) {
                        // Signature: respond(newStatusCode, content, contentType?)
                        // - newStatusCode: HTTP status code (required)
                        // - content: Response content (required)
                        // - contentType: Optional explicit Content-Type header

                        // Handle undefined/null content gracefully to prevent crashes
                        if (content === undefined || content === null) {
                            log(`[responseinterceptor] Warning: ${content === undefined ? 'undefined' : 'null'} content provided for ${req.method} ${req.path} (status ${newStatusCode}), converting to empty string`);
                            content = '';
                        }

                        // Use helper function to set Content-Type header
                        setContentTypeHeader(content, res, contentType);

                        // Send the custom response content
                        res.status(newStatusCode).send(content);
                    });
                } catch (err) {
                    log('[responseinterceptor] Error in interceptByStatusCode callback:', err);
                    if (config.errorHandling.onError) {
                        config.errorHandling.onError(err, req, res);
                    }
                    if (config.errorHandling.rethrow) {
                        throw err;
                    }
                    // Continue with original response on error
                    originalEnd.apply(res, args);
                }

                // Clean up flag after response completes
                res.on('finish', () => { delete res.__interceptHandled; });
            } else {
                // Continue normal response behavior if not intercepted
                originalEnd.apply(this, args);
            }
        };

        next();
    };
};




/**
 * interceptByStatusCodeRedirectTo(statusCodes, callback)
 * ======================================================
 *
 * Middleware for Express.js that intercepts specific HTTP response status codes
 * (e.g., 403, 404, 500) and performs a redirect to another route.
 *
 * This can be used, for example, to automatically redirect users to a custom
 * "Access Denied" or "Not Found" page when a certain response code is about to be sent.
 *
 * The middleware supports **two operation modes**:
 *
 * 1️⃣ **Callback function mode**
 *    - The `callback` parameter is a function `(req, redirect)` that allows
 *      dynamic redirect decisions based on the request.
 *    - The `redirect` argument is a helper function that should be called
 *      with the new route path.
 *
 * 2️⃣ **Static route mode**
 *    - The `callback` parameter is a string representing a fixed redirect route.
 *    - The middleware will automatically redirect to that path when the
 *      specified status code is detected.
 *
 * ---
 *
 * @param {number|number[]} statusCodes
 *   A single status code (e.g., `403`) or an array of codes (e.g., `[403, 404]`)
 *   to intercept and handle.
 *
 * @param {function|string} callback
 *   - If a **function**, it will be executed as `callback(req, redirect)`.
 *     The callback can decide dynamically where to redirect the request.
 *   - If a **string**, it is used as a fixed redirect route (e.g., `"/not-found"`).
 *
 * ---
 *
 * @example
 * // Example 1: Redirect all 403 responses dynamically
 * app.use(
 *   interceptByStatusCodeRedirectTo(403, (req, redirect) => {
 *     if (req.user) redirect('/no-access');
 *     else redirect('/login');
 *   })
 * );
 *
 * @example
 * // Example 2: Redirect all 404 responses to a static route
 * app.use(
 *   interceptByStatusCodeRedirectTo(404, '/not-found')
 * );
 *
 * ---
 *
 * @returns {Function} Express middleware function `(req, res, next)`.
 *
 * @note
 * The middleware automatically prevents infinite redirect loops by setting
 * a temporary internal flag (`res.__interceptHandled`).
 *
 * It restores the original `res.end()` behavior for all non-intercepted responses.
 */


exports.interceptByStatusCodeRedirectTo = function (statusCodes, callback) {
    // Validate parameters
    if (!statusCodes || (typeof statusCodes !== 'number' && !Array.isArray(statusCodes))) {
        throw new TypeError('statusCodes must be a number or an array of numbers');
    }
    if (typeof callback !== 'function' && typeof callback !== 'string') {
        throw new TypeError('callback must be a function or a string');
    }

    return function (req, res, next) {
        const originalEnd = res.end;

        res.end = function (...args) {
            // Prevent recursive interception (avoid redirect loops)
            if (res.__interceptHandled) {
                return originalEnd.apply(this, args);
            }

            // Normalize statusCodes into an array of numbers
            const statusCodeList = Array.isArray(statusCodes)
                ? statusCodes
                : typeof statusCodes === 'number'
                    ? [statusCodes]
                    : [];

            // Check if response matches one of the intercepted status codes
            const hasStatus = statusCodeList.some(
                (status) => typeof status === 'number' && res.statusCode === status
            );

            if (hasStatus) {
                // Mark as handled to avoid recursive interception
                res.__interceptHandled = true;

                try {
                    if (typeof callback === 'function') {
                        // Execute user callback with redirect helper
                        callback(req, function (newRoute) {
                            if (typeof newRoute === 'string' && newRoute.trim()) {
                                res.redirect(newRoute);
                            } else {
                                log('[responseinterceptor] Invalid redirect route from callback:', newRoute);
                                originalEnd.apply(res, args);
                            }
                        });
                    } else if (typeof callback === 'string' && callback.trim()) {
                        // Direct string: use it as a route to redirect
                        res.redirect(callback);
                    } else {
                        log('[responseinterceptor] Invalid callback for interceptByStatusCodeRedirectTo:', callback);
                        originalEnd.apply(res, args);
                    }
                } catch (err) {
                    log('[responseinterceptor] Error during redirect interception:', err);
                    if (config.errorHandling.onError) {
                        config.errorHandling.onError(err, req, res);
                    }
                    if (config.errorHandling.rethrow) {
                        throw err;
                    }
                    originalEnd.apply(res, args);
                }

                // Clean up flag after response completes
                res.on('finish', () => { delete res.__interceptHandled; });
            } else {
                // Continue normal response flow
                originalEnd.apply(this, args);
            }
        };

        next();
    };
};




/*
 <table><tbody>
 <tr><th align="left">Alessandro Romanino</th><td><a href="https://github.com/aromanino">GitHub/aromanino</a></td><td><a href="mailto:a.romanino@gmail.com">mailto:a.romanino@gmail.com</a></td></tr>
 <tr><th align="left">Guido Porruvecchio</th><td><a href="https://github.com/gporruvecchio">GitHub/porruvecchio</a></td><td><a href="mailto:guido.porruvecchio@gmail.com">mailto:guido.porruvecchio@gmail.com</a></td></tr>
 </tbody></table>
 * */