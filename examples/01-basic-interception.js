/**
 * Example: Basic Response Interception
 * 
 * This example shows how to intercept all responses and add metadata
 */

const express = require('express');
const responseinterceptor = require('responseinterceptor');

const app = express();

// Intercept all responses and add timestamp + server info
app.use(responseinterceptor.intercept((body, contentType, req, callback) => {
    // Only modify JSON responses
    if (contentType.includes('application/json') && typeof body === 'object') {
        body.metadata = {
            timestamp: new Date().toISOString(),
            server: 'API v1.0',
            requestId: req.headers['x-request-id'] || 'unknown'
        };
    }
    
    callback(body);
}));

// Sample routes
app.get('/api/users', (req, res) => {
    res.json({
        users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ]
    });
});

app.get('/api/products', (req, res) => {
    res.json({
        products: [
            { id: 1, name: 'Laptop', price: 999 },
            { id: 2, name: 'Mouse', price: 29 }
        ]
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\nTry these endpoints:');
    console.log(`  GET http://localhost:${PORT}/api/users`);
    console.log(`  GET http://localhost:${PORT}/api/products`);
});
