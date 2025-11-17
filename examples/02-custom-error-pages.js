/**
 * Example: Custom Error Pages with Status Code Interception
 * 
 * This example shows how to create custom error pages for different status codes
 */

const express = require('express');
const responseinterceptor = require('responseinterceptor');

const app = express();

// Custom 404 page
app.use(responseinterceptor.interceptByStatusCode(404, (req, respond) => {
    const htmlPage = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                h1 { font-size: 72px; margin: 0; }
                p { font-size: 24px; }
                a { color: #fff; text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Oops! The page you're looking for doesn't exist.</p>
            <p>Path: <code>${req.path}</code></p>
            <a href="/">Go back home</a>
        </body>
        </html>
    `;
    
    respond(404, htmlPage);
}));

// Custom 500 error page
app.use(responseinterceptor.interceptByStatusCode(500, (req, respond) => {
    const htmlPage = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>500 - Server Error</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                h1 { font-size: 72px; margin: 0; }
                p { font-size: 24px; }
            </style>
        </head>
        <body>
            <h1>500</h1>
            <p>Internal Server Error</p>
            <p>Something went wrong on our end. We're working on it!</p>
        </body>
        </html>
    `;
    
    respond(500, htmlPage);
}));

// Custom 403 Forbidden
app.use(responseinterceptor.interceptByStatusCode(403, (req, respond) => {
    respond(403, {
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
        path: req.path,
        timestamp: new Date().toISOString()
    }, 'application/json; charset=utf-8');
}));

// Sample routes
app.get('/', (req, res) => {
    res.send('<h1>Home Page</h1><p>Visit /nonexistent to see 404</p>');
});

app.get('/error', (req, res) => {
    res.status(500).send('Error');
});

app.get('/forbidden', (req, res) => {
    res.status(403).send('Access denied');
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\nTry these endpoints:');
    console.log(`  GET http://localhost:${PORT}/           - Home page`);
    console.log(`  GET http://localhost:${PORT}/nonexistent - 404 error`);
    console.log(`  GET http://localhost:${PORT}/error       - 500 error`);
    console.log(`  GET http://localhost:${PORT}/forbidden   - 403 error`);
});
