/**
 * Example: Conditional Interception Based on User Role
 * 
 * This example shows how to use interceptOnFly to conditionally modify responses
 */

const express = require('express');
const responseinterceptor = require('responseinterceptor');

const app = express();
app.use(express.json());

// Middleware to simulate authentication
app.use((req, res, next) => {
    // In real app, this would be extracted from JWT or session
    const role = req.headers['x-user-role'] || 'guest';
    req.user = {
        role: role,
        isAdmin: role === 'admin',
        isPremium: role === 'premium' || role === 'admin'
    };
    next();
});

// Protected API endpoint
app.get('/api/dashboard', (req, res) => {
    // Use interceptOnFly for conditional interception
    responseinterceptor.interceptOnFly(req, res, (body, contentType, request, callback) => {
        // Add role-specific data
        if (request.user.isAdmin) {
            body.adminData = {
                totalUsers: 1000,
                serverStatus: 'healthy',
                activeConnections: 42
            };
        }
        
        if (request.user.isPremium) {
            body.premiumFeatures = {
                advancedAnalytics: true,
                customReports: true
            };
        }
        
        // Add user info
        body.userInfo = {
            role: request.user.role,
            accessLevel: request.user.isPremium ? 'premium' : 'basic'
        };
        
        callback(body);
    });
    
    // Send base response
    res.json({
        dashboard: {
            widgets: ['sales', 'traffic', 'revenue'],
            lastUpdate: new Date().toISOString()
        }
    });
});

// API with filtering based on role
app.get('/api/users', (req, res) => {
    responseinterceptor.interceptOnFly(req, res, (body, contentType, request, callback) => {
        // Non-admin users shouldn't see sensitive fields
        if (!request.user.isAdmin && Array.isArray(body.users)) {
            body.users = body.users.map(user => ({
                id: user.id,
                name: user.name
                // Remove email, phone, address for non-admins
            }));
        }
        
        callback(body);
    });
    
    res.json({
        users: [
            { id: 1, name: 'Alice', email: 'alice@example.com', phone: '123-456' },
            { id: 2, name: 'Bob', email: 'bob@example.com', phone: '789-012' }
        ]
    });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\nTry these endpoints with different roles:');
    console.log(`\n  As guest (no header):`);
    console.log(`    curl http://localhost:${PORT}/api/dashboard`);
    console.log(`\n  As premium user:`);
    console.log(`    curl -H "x-user-role: premium" http://localhost:${PORT}/api/dashboard`);
    console.log(`\n  As admin:`);
    console.log(`    curl -H "x-user-role: admin" http://localhost:${PORT}/api/dashboard`);
    console.log(`    curl -H "x-user-role: admin" http://localhost:${PORT}/api/users`);
});
