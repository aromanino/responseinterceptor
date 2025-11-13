# responseinterceptor
This package is **Middleware** for Express responses. It allows you to intercept Express responses (`res.send`, `res.end`, `res.write`, `res.render`, etc.)
and modify them dynamically based on your logic.

[![NPM](https://nodei.co/npm/responseinterceptor.png?downloads=true&downloadRank=true&stars=true)![NPM](https://nodei.co/npm-dl/responseinterceptor.png?months=6&height=3)](https://nodei.co/npm/responseinterceptor/)

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
    * [Intercept All Routes](#intercept-all-routes)
    * [Intercept Route Groups](#intercept-route-groups)
    * [Intercept a Single Route](#intercept-single-route)
* [Status Code Interception](#status-code-interception)
    * [interceptByStatusCode](#interceptbystatuscode)
    * [interceptByStatusCodeRedirectTo](#interceptbystatuscoderedirectto)
* [Integration with Keycloak Middleware](#integration-with-keycloak-middleware)
* [Reference](#reference)
* [Examples](#examples)
* [License](#license)
* [Authors & Contributors](#authors--contributors)

---

## Installation

```bash
npm install responseinterceptor
```

---

## Usage

### Intercept All Routes

To intercept all responses globally in your Express app, use:

```javascript
const express = require('express');
const responseinterceptor = require('responseinterceptor');
const app = express();

app.use(responseinterceptor.intercept((body, contentType, req, callback) => {
    let newBody = body;
    if (contentType === "application/json") {
        newBody.timestamp = Date.now();
    }
    callback(newBody);
}));
```

### Intercept a Single Route

To intercept only one specific route:

```javascript
const express = require('express');
const app = express();
const responseinterceptor = require('responseinterceptor');

const singleInterceptor = responseinterceptor.intercept((body, contentType, req, callback) => {
    let modified = body;
    if (contentType === "application/json") modified.extra = "Intercepted!";
    callback(modified);
});

app.get('/api/data', singleInterceptor, (req, res) => {
    res.send({ message: "Original Response" });
});
```

---

## Status Code Interception

### interceptByStatusCode

Intercepts responses based on specific HTTP status codes and allows modifying or replacing the response content.

```javascript
app.use(responseinterceptor.interceptByStatusCode(403, (req, respond) => {
    respond(200, '<h1>Access Denied</h1><p>You are not authorized to view this page.</p>');
}));
```

### interceptByStatusCodeRedirectTo

Redirects requests when specific HTTP status codes are detected.

#### Static Redirect
```javascript
app.use(responseinterceptor.interceptByStatusCodeRedirectTo(403, '/access-denied'));
```

#### Dynamic Redirect
```javascript
app.use(responseinterceptor.interceptByStatusCodeRedirectTo(403, (req, redirect) => {
    if (req.user) redirect('/no-access');
    else redirect('/login');
}));
```

---

## Integration with Keycloak Middleware

When using `keycloak-express-middleware`, unauthorized users (401/403) may see a blank page with the text `access_denied`.  
To improve UX, you can use `responseinterceptor` to intercept these responses and show a custom page or redirect users.

Example:

```javascript
function tmpInterceptorDynamic(req, respond) {
  respond('/access-denied');
}

app.get('/access-denied', (req, res) => {
  res.render('access-denied');
});

// Intercept unauthorized responses and redirect to a custom access-denied page
app.get('/test403',
  responseinterceptor.interceptByStatusCode(403, tmpInterceptorDynamic),
  keycloakMiddleware.protectMiddleware('none'),
  (req, res) => {
    res.render('configuration', { message: 'Protected Content' });
  }
);

// Static redirect version
app.get('/test403redirectStatic',
  responseinterceptor.interceptByStatusCodeRedirectTo(403, '/access-denied'),
  keycloakMiddleware.protectMiddleware('none'),
  (req, res) => {
    res.render('configuration', { message: 'Protected Content' });
  }
);
```

💡 **Tip:** Although unauthenticated users should normally not reach protected routes, intercepting forbidden responses is useful for
developer convenience and cleaner error handling.

---

## License

MIT License

Copyright (c) 2016 aromanino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

(license text continues...)

---

## Authors & Contributors

**Main Development:**  
CRS4 Microservice Core Team ([cmc.smartenv@crs4.it](mailto:cmc.smartenv@crs4.it))

**Contributors:**
- Alessandro Romanino ([a.romanino@gmail.com](mailto:a.romanino@gmail.com))
- Guido Porruvecchio ([guido.porruvecchio@gmail.com](mailto:guido.porruvecchio@gmail.com))
