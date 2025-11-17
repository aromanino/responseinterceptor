# responseinterceptor

This package is **Middleware** for Express responses. It allows you to intercept an Express response (`res.send`, `res.end`, `res.write`, `res.render`, etc.) and update or upgrade the response with your custom logic.

[![NPM](https://nodei.co/npm/responseinterceptor.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/responseinterceptor/)

[![NPM](https://nodei.co/npm-dl/responseinterceptor.png?months=6&height=3)](https://nodei.co/npm/responseinterceptor/)

## Features

- ✅ Intercept and modify Express responses globally or selectively
- ✅ Support for all response methods (`res.send()`, `res.json()`, `res.render()`, etc.)
- ✅ Conditional interception based on content type
- ✅ Status code-based interception with custom handlers
- ✅ Automatic redirection based on status codes
- ✅ On-the-fly interception for dynamic scenarios
- ✅ **Automatic Content-Type detection (JSON, HTML, plain text)**
- ✅ **Optional explicit Content-Type parameter for custom types**
- ✅ **Buffer support for binary content**
- ✅ **Enhanced error handling with try-catch protection**
- ✅ **Parameter validation for improved reliability**
- ✅ **Production-ready logging (disabled in production by default)**
- ✅ **Configurable logging with custom loggers (Winston, Bunyan, Pino)**
- ✅ **Async/await support in all callbacks**
- ✅ **Custom error handlers for monitoring integration**
- ✅ **PropertiesManager integration for environment-based configuration**
- ✅ Minimal dependencies (`etag` for ETag support, `propertiesmanager` optional)
- ✅ TypeScript support

## Table of Contents

- [Installation](#installation)
- [Using responseinterceptor](#using-responseinterceptor) 
  - [Intercept all routes](#intercept-all-routes)
  - [Intercept a group of routes](#intercept-a-group-of-routes)
    - [Intercept a group of routes defined in the same file](#intercept-a-group-of-routes-defined-in-the-same-file)
    - [Intercept a group of routes using express routing](#intercept-a-group-of-routes-using-express-routing)         
  - [Intercept single routes](#intercept-single-routes)    
    - [Intercept a single route with middleware](#intercept-a-single-route-with-responseinterceptor-middleware)  
    - [Intercept a single route on-the-fly](#intercept-a-single-route-using-responseinterceptor-not-as-a-middleware)   
  - [Intercept by status code](#intercepts-http-responses-based-on-specific-status-codes-before-they-are-sent-to-the-client)
  - [Intercept and redirect (callback)](#intercepts-http-responses-based-on-specific-status-codes-before-they-are-sent-to-the-client-and-redirect-to-url-by-callback)
  - [Intercept and redirect (static)](#intercepts-http-responses-based-on-specific-status-codes-before-they-are-sent-to-the-client-and-redirect-to-url-by-static-string)
- [Reference](#reference)  
  - [configure](#configureoptions)
  - [getConfig](#getconfig)
  - [intercept](#interceptfn)  
  - [interceptOnFly](#interceptonflyreqresfn)
  - [interceptByStatusCode](#interceptbystatuscodestatuscodes-callback)
  - [interceptByStatusCodeRedirectTo](#interceptbystatuscoderedirecttostatuscodes-callback)   
- [Advanced Features](#advanced-features)
  - [Automatic Content-Type Detection](#automatic-content-type-detection)
  - [Explicit Content-Type Override](#explicit-content-type-override)
  - [Buffer Support](#buffer-support)
  - [Error Handling](#error-handling)
  - [Production Logging](#production-logging)
  - [PropertiesManager Integration](#integration-with-propertiesmanager)
- [FAQ](#faq)
- [Examples](#examples)
  - [Intercept JSON responses](#intercept-response-and-add-information-to-response-if-content-type-is-applicationjson)
  - [Intercept HTML responses](#intercept-response-and-add-information-to-response-if-content-type-is-texthtml)
- [TypeScript Support](#typescript-support)
- [License](#license)
- [Authors](#authors)

## Installation

To use **responseinterceptor** install it in your project by typing:

```shell
$ npm install responseinterceptor
```

## Using responseinterceptor

### Include responseinterceptor

Just require it like a simple package:

```javascript
const responseinterceptor = require('responseinterceptor');
```

### Intercept all routes

To intercept all routes, use it in `app.js` before all `app.use()` route functions:

```javascript
const express = require('express');
const responseinterceptor = require('responseinterceptor');
const routeTwo = require("./routes/routeTwo");
const app = express();
 
app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback){
    // Your custom logic after intercepting the response
    // Example: Add timestamp to response body
    let newResponse = body;
    if(bodyContentType === "application/json")  // Check if response is JSON
         newResponse.otherInformation = Date.now(); // Add current timestamp
    callback(newResponse); // Return modified response
}));  

// All routes defined below this middleware will be intercepted
app.use("exampleRoute_one", function(req, res, next){
    // your logic
}); 
app.use("exampleRoute_Two", routeTwo);  

// Other routes...  
```


### Intercept a group of routes

You can decide which routes to intercept using or not using Express router. Read below for more details. 

#### Intercept a group of routes defined in the same file

To intercept only a group of routes, use responseinterceptor middleware after the routes that should not be intercepted and before all routes to intercept. For example, intercept all routes matching `"/intercept/onlythis"`:

```javascript
const express = require('express');    
const responseinterceptor = require('responseinterceptor');
const app = express();
    
// ############ Group of routes to not intercept ############
app.get("/", function(req, res, next){
    // your logic
});    
app.post("/", function(req, res, next){
    // your logic
});
app.get("/intercept", function(req, res, next){
    // your logic
});
// Additional routes that will NOT be intercepted...
    
// ############ Group of routes to intercept ############
// Place responseinterceptor middleware before all routes you want to intercept
app.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback){
  // Your custom logic after intercepting the response
  // Example: Add timestamp to response body
  let newResponse = body;
      
  if(bodyContentType === "application/json")  // Check if response is JSON
         newResponse.otherInformation = Date.now(); // Add current timestamp
  callback(newResponse); // Return modified response
}));  
app.get("/intercept/onlythis", function(req, res, next){
    // your logic
    res.send({data: "...."}); // This response WILL be intercepted
});
app.post("/intercept/onlythis", function(req, res, next){
    // your logic
    res.send({data: "...."}); // This response WILL be intercepted
}); 
// Additional routes that WILL be intercepted...
```

#### Intercept a group of routes using express routing

To intercept only a group of routes using Express routing, use responseinterceptor middleware in a separate Express routing file. For example, intercept all routes under `"/intercept"`.

Define a router for `"/intercept"`, for example in file `routeInt.js`:

```javascript
const express = require('express');
const router = express.Router();
const responseinterceptor = require('responseinterceptor');

// Place responseinterceptor middleware before all routes you want to intercept
router.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback){   
    // Your custom logic after intercepting the response
    // Example: Add timestamp to response body
    let newResponse = body;
    if(bodyContentType === "application/json")  // Check if response is JSON
         newResponse.otherInformation = Date.now(); // Add current timestamp
    callback(newResponse); // Return modified response
}));   
// define routes to intercept
router.get("/", function(req, res, next){
    // your logic
    res.send({data: "...."}); // This response WILL be intercepted
});
router.post("/alsothis", function(req, res, next){
    // your logic
    res.send({data: "...."}); // This response WILL be intercepted
}); 
// Additional routes to intercept...

module.exports = router;
```

In `app.js` use the `"/intercept"` route:

```javascript    
const express = require('express');
const routeInt = require('./routes/routeInt');
const app = express();

app.use('/intercept', routeInt);   
```


### Intercept single routes

To intercept a single route response, use responseinterceptor not as a global level middleware but at the single endpoint definition level, as middleware or in the endpoint logic.

You might think that using responseinterceptor at the endpoint level makes no sense because you could include the interceptor logic directly before sending the response. However, this is not always true. There are real use cases where you need to do it:

*   If you need to save all response logs including all information embedded in the response from the `write`/`end` function (for example, fields like `etag`, `content-length`, etc. are calculated in `write`/`end` after `res.send()` is called).
*   If you need to intercept the response content after page rendering from a template engine like Jade/Pug to modify or log some contents (intercept response content after `res.render()`).

#### Intercept a single route with responseinterceptor middleware

To intercept a single route, use responseinterceptor middleware in the endpoint route definition. For example, intercept all `"/intercept/"` routes in POST method but not in GET method:

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');
    
// Route without interception
app.get("/", function(req, res, next){
    
});
// Route with interception applied via middleware
app.post("/", middlewareInterceptor, function(req, res, next){
   // Your Logic   
   res.send({data: "...."}); // This response WILL be intercepted
});
const middlewareInterceptor = responseinterceptor.intercept(function(body, bodyContentType, request, callback){   
    // Your custom logic after intercepting the response
    // Example: Add timestamp to response body
    let newResponse = body;
    if(bodyContentType === "application/json")  // Check if response is JSON
         newResponse.otherInformation = Date.now(); // Add current timestamp
    callback(newResponse); // Return modified response
});
// This route is NOT intercepted because the middleware is applied at route level,
// not globally. Only routes explicitly using middlewareInterceptor will be intercepted.
app.get("/notInterceptable", function(req, res, next){
    // Your Logic   
    res.send({data: "...."}); // This response will NOT be intercepted
 });
 
// Another route with interception
app.post("/interceptable", middlewareInterceptor, function(req, res, next){
 // Your Logic   
 res.send({data: "...."}); // This response WILL be intercepted
});
```

#### Intercept a single route using responseinterceptor not as a middleware

To intercept a single route using responseinterceptor not as middleware but only if a particular condition in the endpoint logic is satisfied, you should use the `interceptOnFly` function. For example, intercept a route `"/intercept"` in GET method only if the request has a field `"intercept"` set to `true`:

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');
    
// Route without interception
app.get("/", function(req, res, next){
    
});
// Conditionally intercept based on request parameter
app.get("/intercept", function(req, res, next){
   // Your Logic   
   if(req.query.intercept == true){
        responseinterceptor.interceptOnFly(req, res, function(body, bodyContentType, request, callback){   
            // Your custom logic after intercepting the response
            // newResponse = ...
            callback(newResponse); // Return modified response
        });
   }
   
   // Additional logic...
      
   // This response will be intercepted ONLY if req.query.intercept is true
   res.send({data: "...."});                                        
});
```

### Intercept by HTTP status code

This middleware overrides `res.end()` to detect when the response status matches one of the specified status codes. If a match occurs, it executes a user-defined callback instead of sending the original response.

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');

// Intercept all 403 Forbidden responses
app.use(responseinterceptor.interceptByStatusCode(403, (req, respond) => {
    app.render('access-denied', {}, (err, html) => {
        if (!err) {
            // Template rendered successfully - send custom HTML page
            respond(200, html);
        } else {
            // Fallback if template fails - send simple HTML message
            respond(200, '<h1>Access Denied</h1><p>You are not authorized to view this page.</p>');
        }
    });
}));

// Intercept 404 with JSON response (auto-detected)
app.use(responseinterceptor.interceptByStatusCode(404, (req, respond) => {
    respond(404, { error: 'Not Found', path: req.path });
}));

// Intercept 500 with explicit XML content-type
app.use(responseinterceptor.interceptByStatusCode(500, (req, respond) => {
    respond(500, '<error>Internal Server Error</error>', 'application/xml; charset=utf-8');
}));

// Example route that triggers the interception
app.get('/private', (req, res) => {
    res.status(403).send('Forbidden');
});
```

### Intercept and redirect by HTTP status code (callback)

This middleware overrides `res.end()` to detect when the response status matches one of the specified status codes. If a match occurs, it executes a user-defined callback to redirect to a URL.

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');

// Intercept all 403 Forbidden responses and redirect dynamically
app.use(responseinterceptor.interceptByStatusCodeRedirectTo(403, (req, respond) => {
    respond('/index');
}));

// Example route that triggers interception and redirects to /index
app.get('/private', (req, res) => {
    res.status(403).send('Forbidden');
});
```

### Intercept and redirect by HTTP status code (static URL)

This middleware overrides `res.end()` to detect when the response status matches one of the specified status codes. If a match occurs, it redirects to a static URL.

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');

// Intercept all 403 Forbidden responses and redirect to static URL
app.use(responseinterceptor.interceptByStatusCodeRedirectTo(403, '/index'));

// Example route that triggers interception and redirects to /index
app.get('/private', (req, res) => {
    res.status(403).send('Forbidden');
});
```

## Reference

### `configure(options)`

Configure global options for `responseinterceptor`. This allows customization of logging and error handling behavior.

**Parameters:**

*   `options` - Configuration object
    *   `options.logging` - Logging configuration
        *   `options.logging.enabled` - Boolean to enable/disable logging (default: `false` in production, `true` otherwise)
        *   `options.logging.logger` - Custom logger function (default: `console.log`)
    *   `options.errorHandling` - Error handling configuration
        *   `options.errorHandling.rethrow` - Boolean to rethrow errors (default: `false`)
        *   `options.errorHandling.onError` - Custom error handler function `(err, req, res) => {}`

**Returns:** Current configuration object

**Example:**

```javascript
const { configure } = require('responseinterceptor');

// Configure with Winston logger
const winston = require('winston');
const logger = winston.createLogger({ /* ... */ });

configure({
    logging: {
        enabled: true,
        logger: (...args) => logger.info(args.join(' '))
    },
    errorHandling: {
        rethrow: false,
        onError: (err, req, res) => {
            logger.error('Interceptor error:', {
                error: err.message,
                path: req.path,
                method: req.method
            });
            // Send to monitoring service
            // Sentry.captureException(err);
        }
    }
});

// Dynamic logging control
app.get('/admin/logging/toggle', (req, res) => {
    const config = configure({
        logging: { enabled: !currentlyEnabled }
    });
    res.json({ logging: config.logging.enabled });
});
```

**Integration with PropertiesManager:**

PropertiesManager automatically loads `config/default.json` with environment-based configuration:

```javascript
// config/default.json structure:
{
  "production": {
    "responseinterceptor": {
      "logging": { "enabled": false },
      "errorHandling": { "rethrow": false }
    }
  },
  "test": {
    "responseinterceptor": {
      "logging": { "enabled": false },
      "errorHandling": { "rethrow": true }
    }
  },
  "dev": {
    "responseinterceptor": {
      "logging": { "enabled": true },
      "errorHandling": { "rethrow": false }
    }
  }
}
```

Usage:

```javascript
const propertiesmanager = require('propertiesmanager').conf;
const { configure, getConfig } = require('responseinterceptor');

// PropertiesManager automatically selects environment based on NODE_ENV
// and loads config from config/default.json

// Access configuration (already loaded automatically)
console.log('Logging enabled:', propertiesmanager.responseinterceptor?.logging?.enabled);

// Configuration is automatically applied at startup
// You can override at runtime with configure()
configure({
    logging: {
        enabled: propertiesmanager.responseinterceptor?.logging?.enabled ?? true
    },
    errorHandling: {
        rethrow: propertiesmanager.responseinterceptor?.errorHandling?.rethrow ?? false
    }
});

// Get current configuration
const config = getConfig();
console.log('Current config:', config);
```

Run with different environments:

```bash
# Development (default)
node app.js

# Production
NODE_ENV=production node app.js

# Test
NODE_ENV=test node app.js
```

### `getConfig()`

Get the current configuration settings.

**Returns:** Object with current configuration

**Example:**

```javascript
const { getConfig } = require('responseinterceptor');

const config = getConfig();
console.log('Logging enabled:', config.logging.enabled);
console.log('Error rethrow:', config.errorHandling.rethrow);
```

### `intercept(fn)`

The `intercept(fn)` function is a middleware that intercepts an Express response, so you can use it in the routes you want to intercept. This function returns an Express middleware used to intercept responses. It accepts a function `fn` as a parameter.

The function `fn` is defined as `fn(content, contentType, request, callback)` and is executed when the response is intercepted.

**Parameters:**

*   `content` - Contains the content of the intercepted response
*   `contentType` - A string describing the content type (e.g., `"application/json"`, `"text/html"`, `"text/css"`)
*   `request` - An object containing the original Express `req` request
*   `callback` - The callback function to call when your logic completes, with the new response content as a parameter: `callback(newContent)`. The `newContent` can be a String, Object, HTML, text, etc.
            
**Example:**

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');  

// Intercept all routes defined below
app.use(responseinterceptor.intercept(function(content, contentType, request, callback){
   // Your custom logic here
   // newResponse = ".... new Content ....";
    callback(newResponse); // Return modified response
}));
```

### `interceptOnFly(req, res, fn)`

This function doesn't return an Express middleware and must be used internally in the endpoint logic to intercept responses conditionally. For example, if you need to intercept the response only when a particular condition in the endpoint logic is satisfied.

**Parameters:**

*   `req` - The original Express `req` request object
*   `res` - The original Express `res` response object to intercept
*   `fn` - The interceptor function defined as `fn(content, contentType, request, callback)`:
    *   `content` - Contains the content of the intercepted response
    *   `contentType` - A string describing the content type
    *   `request` - The original Express `req` request object
    *   `callback` - The callback function: `callback(newContent)`
      
**Example:**

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');  

app.get("/resource", function(req, res, next){
    // Your logic to determine if interception is needed
    const intercept = your_Logic ? true : false;
    if(intercept){
        responseinterceptor.interceptOnFly(req, res, function(content, contentType, request, callback){
               // Your custom logic here
               // newResponse = ".... new Content ....";
                callback(newResponse); // Return modified response
            })
    }
    
    res.send("Your Interceptable Content");
});
```

### `interceptByStatusCode(statusCodes, callback)`

Intercepts Express.js responses based on specific HTTP status codes, for example, to render a custom HTML page or JSON message instead of the default error output.

**Description:** 

`interceptByStatusCode(statusCodes, callback)` temporarily overrides `res.end()` to detect when a response is about to be sent with a specific status code (e.g., 403, 404, 500). When a match occurs, it calls your callback, allowing you to customize the response before it's sent. A built-in anti-loop flag ensures the middleware doesn't re-trigger itself when the callback sends the new response.

**Signature:**

```javascript
interceptByStatusCode(statusCodes, callback)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `statusCodes` | `number \| number[]` | A single status code or an array of status codes to intercept |
| `callback` | `(req, respond) => void` | Function executed when one of the specified status codes is detected |

**Callback Parameters:**

- `req` - The Express request object
- `respond(newStatusCode, content, contentType?)` - A helper function to send a new response
  - `newStatusCode` - **Required** HTTP status code (e.g., 200, 403, 404)
  - `content` - **Required** HTML, string, object, or Buffer to send in the response
  - `contentType` - **Optional** explicit Content-Type header (e.g., `'application/json; charset=utf-8'`, `'text/html; charset=utf-8'`)
    - If omitted, Content-Type is automatically detected:
      - **Objects** → `application/json`
      - **JSON strings** (starting with `{` or `[`) → `application/json`
      - **HTML strings** (containing `<!DOCTYPE`, `<html>`, `<body>`, `<head>`) → `text/html`
      - **Buffers** → `application/octet-stream`
      - **Other strings** → `text/plain`

**Example:**

```javascript
const express = require('express');
const app = express();
const { interceptByStatusCode } = require('responseinterceptor');

// Example 1: Auto-detect Content-Type (HTML)
app.use(interceptByStatusCode(403, (req, respond) => {
    respond(200, '<h1>Access Denied</h1><p>You are not authorized to view this page.</p>');
}));

// Example 2: Auto-detect Content-Type (JSON)
app.use(interceptByStatusCode(404, (req, respond) => {
    respond(404, { error: 'Not Found', path: req.path, timestamp: Date.now() });
}));

// Example 3: Explicit Content-Type for custom formats
app.use(interceptByStatusCode(500, (req, respond) => {
    const xmlError = '<error><code>500</code><message>Internal Server Error</message></error>';
    respond(500, xmlError, 'application/xml; charset=utf-8');
}));

// Example route that triggers the interception
app.get('/private', (req, res) => {
    res.status(403).send('Forbidden');
});
```



### `interceptByStatusCodeRedirectTo(statusCodes, callback)`

`interceptByStatusCodeRedirectTo` is an Express.js middleware that **intercepts outgoing HTTP responses** with specific status codes (e.g., `403`, `404`, `500`) and automatically **redirects** the request to another route. It can be used to handle unauthorized, forbidden, or missing resources gracefully — for example, sending users to a custom "Access Denied" or "Not Found" page.

The middleware supports **two usage modes**:

- **Callback mode:** Dynamic redirect logic based on the request
- **Static route mode:** Automatic redirect to a predefined route

---

#### Function Signature

```js
interceptByStatusCodeRedirectTo(statusCodes, callback)
```

---

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `statusCodes` | `number \| number[]` | A single status code (e.g., `403`) or an array of codes (e.g., `[403, 404]`) to intercept |
| `callback` | `function \| string` | Determines how redirection occurs. <br>• If a **function**, it will be called as `callback(req, redirect)` where `redirect` is a helper to trigger a redirect<br>• If a **string**, it represents a static route path to redirect to directly |

---

#### Usage Examples

##### 1️⃣ Dynamic Redirect Logic (callback mode)

Redirect users differently depending on the request or session:

```js
const express = require('express');
const { interceptByStatusCodeRedirectTo } = require('responseinterceptor');
const app = express();

app.use(
  interceptByStatusCodeRedirectTo(403, (req, redirect) => {
    if (req.user) {
      redirect('/no-access');
    } else {
      redirect('/login');
    }
  })
);
```

If a `403` response is about to be sent:
- Logged-in users are redirected to `/no-access`
- Unauthenticated users are redirected to `/login`

---

##### 2️⃣ Static Redirect (string mode)

Redirect all matching status codes to a fixed route:

```js
const express = require('express');
const { interceptByStatusCodeRedirectTo } = require('responseinterceptor');
const app = express();

app.use(
  interceptByStatusCodeRedirectTo([403, 404], '/error-page')
);
```

Any `403` or `404` response automatically redirects to `/error-page`.

---

#### How It Works

- The middleware **overrides** `res.end()` temporarily to intercept the response before it is finalized
- When the outgoing `statusCode` matches one of the provided values:
    - The `callback` (or redirect path) is executed
    - The response is redirected using `res.redirect(newRoute)`
- A safety flag (`res.__interceptHandled`) prevents **recursive loops**, ensuring that redirects do not trigger interception again
- Non-matching responses continue normally using the original `res.end()`

---

#### Notes

- Works transparently with any Express route or controller
- Compatible with async request handlers and standard middleware chaining
- Automatically cleans up internal flags after the response finishes

---

#### Example Use Cases

- Redirect users to a login page when a `403 Forbidden` occurs
- Redirect to a friendly error page on `404 Not Found`
- Implement centralized handling for maintenance mode (`503 Service Unavailable`)

---

#### Return Value

Returns an Express middleware function `(req, res, next)`.



---

## Advanced Features

### Automatic Content-Type Detection

Starting from version 2.0.6, `interceptByStatusCode` includes automatic Content-Type detection. When you don't specify a `contentType` parameter, the middleware intelligently detects the appropriate Content-Type based on the response content:

```javascript
const { interceptByStatusCode } = require('responseinterceptor');

app.use(interceptByStatusCode(404, (req, respond) => {
    // Automatic detection: application/json
    respond(404, { error: 'Not Found', code: 404 });
    
    // Automatic detection: text/html
    respond(404, '<h1>Page Not Found</h1><p>The requested resource does not exist.</p>');
    
    // Automatic detection: application/json (JSON string)
    respond(404, '{"error": "Not Found"}');
    
    // Automatic detection: text/plain
    respond(404, 'Simple error message');
}));
```

**Detection Rules:**

| Content Type | Detection Logic |
|-------------|-----------------|
| `application/json` | JavaScript objects or strings starting with `{` or `[` and ending with `}` or `]` |
| `text/html` | Strings containing `<!DOCTYPE`, `<html>`, `<body>`, or `<head>` tags |
| `application/octet-stream` | Buffer objects |
| `text/plain` | All other string content (fallback) |

### Explicit Content-Type Override

For complete control over the Content-Type header, use the optional third parameter:

```javascript
app.use(interceptByStatusCode(404, (req, respond) => {
    // Explicit XML content type
    respond(404, '<error><code>404</code><message>Not Found</message></error>', 
            'application/xml; charset=utf-8');
    
    // Explicit custom content type
    respond(404, customBinaryData, 'application/pdf');
    
    // Explicit charset
    respond(404, htmlContent, 'text/html; charset=iso-8859-1');
}));
```

### Buffer Support

The middleware now supports Buffer objects for binary content:

```javascript
app.use(interceptByStatusCode(500, (req, respond) => {
    const imageBuffer = fs.readFileSync('./error-image.png');
    respond(500, imageBuffer, 'image/png');
}));
```

### Error Handling

All interceptor functions now include comprehensive error handling:

- **Callback errors** are caught and logged (in development mode only)
- **Invalid parameters** throw TypeScript-style `TypeError` exceptions
- **Failed interceptors** fall back to original response to prevent crashes

```javascript
// Parameter validation example
try {
    app.use(interceptByStatusCode(null, callback));  // Throws TypeError
} catch (err) {
    console.error(err.message);  // "statusCodes must be a number or an array of numbers"
}

// Callback error handling
app.use(interceptByStatusCode(404, (req, respond) => {
    throw new Error('Oops!');  // Error is caught, original response continues
}));
```

### Production Logging

Console logging is automatically disabled in production environments. To enable logging in production, remove the `NODE_ENV=production` check:

```javascript
// Development: logs are visible
// Production: logs are suppressed

// To force logging in production, set NODE_ENV differently:
// NODE_ENV=development node app.js
```

### Integration with PropertiesManager

The `responseinterceptor` integrates seamlessly with [propertiesmanager](https://www.npmjs.com/package/propertiesmanager) for centralized, environment-based configuration management.

**Setup:**

1. Install propertiesmanager:
```bash
npm install propertiesmanager
```

2. Create `config/default.json` with environment-based configuration:
```json
{
  "production": {
    "responseinterceptor": {
      "logging": { "enabled": false },
      "errorHandling": { "rethrow": false }
    }
  },
  "test": {
    "responseinterceptor": {
      "logging": { "enabled": false },
      "errorHandling": { "rethrow": true }
    }
  },
  "dev": {
    "responseinterceptor": {
      "logging": { "enabled": true },
      "errorHandling": { "rethrow": false }
    }
  }
}
```

3. Use in your application:
```javascript
const propertiesmanager = require('propertiesmanager').conf;
const { configure } = require('responseinterceptor');

// PropertiesManager automatically loads config based on NODE_ENV
// Configuration is applied at startup automatically

// Optional: Override at runtime
configure({
    logging: {
        enabled: propertiesmanager.responseinterceptor?.logging?.enabled ?? true
    },
    errorHandling: {
        rethrow: propertiesmanager.responseinterceptor?.errorHandling?.rethrow ?? false
    }
});
```

**Environment Selection:**
```bash
# Development (default)
node app.js

# Production
NODE_ENV=production node app.js

# Test
NODE_ENV=test node app.js
```

**Benefits:**
- ✅ Centralized configuration management
- ✅ Environment-specific settings (production, test, dev)
- ✅ Automatic environment detection via NODE_ENV
- ✅ No code changes needed between environments
- ✅ Runtime configuration updates with `configure()`

See `examples/06-propertiesmanager-config.js` for a complete working example.

### Combining Multiple Interceptors

You can chain multiple `interceptByStatusCode` middleware for different status codes:

```javascript
// Handle 404 errors
app.use(interceptByStatusCode(404, (req, respond) => {
    respond(404, { error: 'Page Not Found', path: req.path });
}));

// Handle 500 errors
app.use(interceptByStatusCode(500, (req, respond) => {
    respond(500, { error: 'Internal Server Error', timestamp: Date.now() });
}));

// Handle multiple codes with one handler
app.use(interceptByStatusCode([401, 403], (req, respond) => {
    respond(403, '<h1>Access Denied</h1>');
}));
```

---

## Examples

### Intercept response and add information to response if Content-Type is "application/json"

Intercept a group of routes and add a timestamp field to the response when the body Content-Type is `"application/json"`:

```javascript
const express = require('express');
const router = express.Router();
const responseinterceptor = require('responseinterceptor');
    
// ############ Routes without interception ############
router.get("/", function(req, res, next){
    res.status(200).send({"content": "myContent"});
});             
// Additional routes without interception...
        
// ############ Routes with interception ############
router.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback){
    let newResponse = body;
    if(bodyContentType === "application/json")  // Check if response is JSON
             newResponse.timestamp = Date.now(); // Add current timestamp
    callback(newResponse); // Return modified response with timestamp
}));    
router.get("/withTimestamp", function(req, res, next){
    // This response WILL be intercepted and timestamp will be added
    res.status(200).send({"content": "myContent"});
});
// Additional routes to intercept...
```

In `app.js` use the `"/intercept"` route:

```javascript    
const express = require('express');
const routeInt = require('./routes/routeInt');
const app = express();

app.use('/intercept', routeInt);   
```

Call the service with curl to see the results:

```shell
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 23
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

{"content":"myContent"} // Response without timestamp field
$
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept/withTimestamp
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 51
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

{"content":"myContent","timestamp":"1478870174325"} // Response with timestamp field
```


### Intercept response and add information to response if Content-Type is "text/html"

Intercept a group of routes and replace all HTML `<ul>` tags with `<ol>` tags:

```javascript
const express = require('express');
const router = express.Router();
const responseinterceptor = require('responseinterceptor');
const htmlContent = '<html>\
                    <head> </head>\
                    <body contenteditable="false">\
                        <h2>An unordered HTML list</h2>\
                        <ul>\
                            <li>Coffee</li>\
                            <li>Tea</li>\
                            <li>Milk</li>\
                        </ul>\
                    </body>\
                </html>';
    
// ############ Routes without interception ############
router.get("/", function(req, res, next){
    res.status(200).send(htmlContent);
});            
// Additional routes without interception...
        
// ############ Routes with interception ############    
router.use(responseinterceptor.intercept(function(body, bodyContentType, request, callback){          
    let newResponse = body;
    if(bodyContentType === "text/html")  // Check if response is HTML
             newResponse = body.replace("<ul>", "<ol>").replace("</ul>", "</ol>"); // Replace ul tags with ol tags
    callback(newResponse); // Return modified HTML
}));
router.get("/withOLTag", function(req, res, next){
    // This response WILL be intercepted and <ul> tags will be replaced with <ol>
    res.status(200).send(htmlContent);
});
// Additional routes to intercept...
```

In `app.js` use the `"/intercept"` route:

```javascript    
const express = require('express');
const routeInt = require('./routes/routeInt');
const app = express();

app.use('/intercept', routeInt);
```

Call the service with curl to see the results:

```shell
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 316
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

// Response with original <ul> tag
<html>
    <head> </head>
        <body contenteditable="false">                    
            <h2>An unordered HTML list</h2>                    
                <ul>
                    <li>Coffee</li>
                    <li>Tea</li>
                    <li>Milk</li>
                </ul>
        </body>
</html>
$
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept/withOLTag
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 316
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

// Response with modified <ol> tag
<html>
    <head> </head>
        <body contenteditable="false">                    
            <h2>An unordered HTML list</h2>                    
                <ol>
                    <li>Coffee</li>
                    <li>Tea</li>
                    <li>Milk</li>
                </ol>
        </body>
</html>
```

## TypeScript Support

The package includes TypeScript definitions. Here's an example of using responseinterceptor with TypeScript:

```typescript
import express, { Request, Response, NextFunction } from 'express';
import * as responseinterceptor from 'responseinterceptor';

const app = express();

// Type-safe interceptor
app.use(responseinterceptor.intercept((
    body: any,
    bodyContentType: string,
    request: Request,
    callback: (newContent: any) => void
) => {
    let newResponse = body;
    
    if (bodyContentType === "application/json") {
        newResponse.timestamp = Date.now();
        newResponse.server = "MyAPI";
    }
    
    callback(newResponse);
}));

// Status code interception with TypeScript
app.use(responseinterceptor.interceptByStatusCode(
    [403, 404],
    (req: Request, respond: (status: number, content: any, contentType?: string) => void) => {
        // Auto-detect Content-Type (JSON)
        respond(404, {
            error: true,
            message: "Resource not found or access denied"
        });
    }
));

// With explicit Content-Type
app.use(responseinterceptor.interceptByStatusCode(
    500,
    (req: Request, respond: (status: number, content: any, contentType?: string) => void) => {
        respond(500, '<error>Internal Server Error</error>', 'application/xml; charset=utf-8');
    }
));

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

---

## FAQ

### How do I disable logging in production?

Logging is automatically disabled when `process.env.NODE_ENV === 'production'`. If you need to customize this behavior, you can set the environment variable:

```bash
export NODE_ENV=production
```

### Can I use async/await in callbacks?

Yes! All callbacks support async functions:

```javascript
app.use(interceptByStatusCode([404], async (req, res, newStatusCode, content) => {
  const customContent = await fetchCustomErrorPage();
  res.respond(newStatusCode, customContent);
}));
```

### How do I handle binary data (images, PDFs, etc.)?

Use Buffer with explicit Content-Type:

```javascript
app.use(intercept((body, req, res) => {
  if (req.path === '/logo') {
    const imageBuffer = fs.readFileSync('./logo.png');
    return res.respond(200, imageBuffer, 'image/png');
  }
  return body;
}));
```

### What happens if my callback throws an error?

Errors are caught automatically and the original response is sent to prevent connection issues:

```javascript
app.use(intercept((body, req, res) => {
  try {
    // Your logic
    return transformedBody;
  } catch (error) {
    console.error('Intercept error:', error);
    return body; // Fallback to original
  }
}));
```

### What happens if I pass `undefined` or `null` as content?

The middleware automatically converts `undefined` and `null` to empty strings to prevent crashes:

```javascript
app.use(interceptByStatusCode([404], (req, respond) => {
  // These are automatically handled:
  respond(404, undefined);  // Converted to ''
  respond(404, null);       // Converted to ''
  
  // Warning is logged in development:
  // [responseinterceptor] Warning: undefined content provided for GET /path (status 404)
}));
```

**Best practice**: Always provide explicit content to avoid warnings.

### Can I intercept multiple status codes?

Yes, pass an array:

```javascript
app.use(interceptByStatusCode([400, 401, 403, 404, 500], (req, res, statusCode, content) => {
  res.respond(statusCode, customErrorPage(statusCode));
}));
```

### How do I check Content-Type before modifying?

Use `req.get('content-type')` or check the body:

```javascript
app.use(intercept((body, req, res) => {
  const contentType = res.get('Content-Type');
  
  if (contentType && contentType.includes('application/json')) {
    return { ...body, modified: true };
  }
  
  return body;
}));
```

### What's the performance impact?

Minimal! Benchmarks show:
- Global intercept: ~0.5ms overhead per request
- Status code intercept: ~0.2ms overhead only when triggered
- Content-Type detection: <0.001ms per operation

See `test/performance.test.js` for detailed benchmarks.

### How do I migrate from v1.x to v2.x?

The API is backward compatible. Key changes:
- Content-Type is now auto-detected (no breaking changes)
- Optional `contentType` parameter for explicit types
- Enhanced error handling (transparent, no changes needed)

### Can I use this with TypeScript?

Yes! Type definitions are included:

```typescript
import { intercept, interceptByStatusCode } from 'responseinterceptor';

app.use(intercept((body: any, req: Request, res: Response) => {
  // Your typed logic
  return body;
}));
```

### How do I use PropertiesManager for configuration?

Install `propertiesmanager` and create `config/default.json`:

```bash
npm install propertiesmanager
```

```json
{
  "production": {
    "responseinterceptor": {
      "logging": { "enabled": false },
      "errorHandling": { "rethrow": false }
    }
  },
  "dev": {
    "responseinterceptor": {
      "logging": { "enabled": true },
      "errorHandling": { "rethrow": false }
    }
  }
}
```

PropertiesManager automatically loads configuration based on `NODE_ENV`. See [Integration with PropertiesManager](#integration-with-propertiesmanager) for details.

### How do I contribute or report security issues?

- Contributing: See [CONTRIBUTING.md](CONTRIBUTING.md)
- Security: See [SECURITY.md](SECURITY.md)

---

## License

**MIT License**

Copyright (c) 2016 aromanino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Authors

**Author:**  
CRS4 Microservice Core Team ([cmc.smartenv@crs4.it](mailto:cmc.smartenv@crs4.it))

**Contributors:**  
- Alessandro Romanino ([a.romanino@gmail.com](mailto:a.romanino@gmail.com))
- Guido Porruvecchio ([guido.porruvecchio@gmail.com](mailto:guido.porruvecchio@gmail.com))
