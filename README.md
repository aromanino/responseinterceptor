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
- ✅ Zero dependencies
- ✅ TypeScript support

## Table of Contents

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
  - [intercept](#interceptfn)  
  - [interceptOnFly](#interceptonflyreqresfn)
  - [interceptByStatusCode](#interceptbystatuscodestatuscodes-callback)
  - [interceptByStatusCodeRedirectTo](#interceptbystatuscoderedirecttostatuscodes-callback)   
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
- `respond(newStatusCode, content)` - A helper function to send a new response
  - `newStatusCode` - Optional new status code (e.g., 200 or 403)
  - `content` - HTML, string, or object to send in the response

**Example:**

```javascript
const express = require('express');
const app = express();
const { interceptByStatusCode } = require('responseinterceptor');

// Intercept all 403 Forbidden responses
app.use(interceptByStatusCode(403, (req, respond) => {
    respond(200, '<h1>Access Denied</h1><p>You are not authorized to view this page.</p>');
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
    (req: Request, respond: (status: number, content: any) => void) => {
        respond(200, {
            error: true,
            message: "Resource not found or access denied"
        });
    }
));

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

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
