/**
 * Advanced Example: Async/Await with Custom Configuration
 * =========================================================
 * 
 * This example demonstrates:
 * - Using async/await in callbacks for asynchronous operations
 * - Custom logging configuration with Winston
 * - Error handling with custom error handler
 * - Database lookups and external API calls
 * - Performance monitoring
 */

const express = require('express');
const { configure, intercept, interceptByStatusCode } = require('../index');

// Simulate external dependencies (replace with real ones)
const winston = require('winston').createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

const app = express();
app.use(express.json());

// ============================================================================
// 1. Configure responseinterceptor with custom options
// ============================================================================

configure({
    logging: {
        enabled: true,
        logger: (...args) => winston.info(args.join(' '))
    },
    errorHandling: {
        rethrow: false,
        onError: (err, req, res) => {
            winston.error('Interceptor error:', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method
            });
            
            // Send error metrics to monitoring service
            // sendMetric('interceptor.error', 1, { path: req.path });
        }
    }
});

// ============================================================================
// 2. Async/Await: Enriching responses with database data
// ============================================================================

// Mock database functions (replace with real DB calls)
async function fetchUserProfile(userId) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com',
                role: 'admin'
            });
        }, 50);
    });
}

async function fetchUserStats(userId) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                loginCount: 42,
                lastLogin: new Date().toISOString(),
                activityScore: 87
            });
        }, 30);
    });
}

// Global middleware with async operations
app.use(intercept(async (body, header, req, respond) => {
    const startTime = Date.now();
    
    try {
        // Only process JSON API responses
        if (header.includes('application/json') && req.path.startsWith('/api/')) {
            
            // Example: Enrich user data with profile info
            if (body.userId && !body.userProfile) {
                const [profile, stats] = await Promise.all([
                    fetchUserProfile(body.userId),
                    fetchUserStats(body.userId)
                ]);
                
                body.userProfile = profile;
                body.userStats = stats;
            }
            
            // Add performance metrics
            const processingTime = Date.now() - startTime;
            body._meta = {
                ...body._meta,
                processingTime: `${processingTime}ms`,
                timestamp: new Date().toISOString(),
                enriched: true
            };
        }
        
        respond(body);
    } catch (error) {
        winston.error('Error enriching response:', error);
        // Return original body on error
        respond(body);
    }
}));

// ============================================================================
// 3. Async/Await: Custom error pages with template rendering
// ============================================================================

async function renderErrorTemplate(statusCode, message) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error ${statusCode}</title>
                    <style>
                        body { font-family: Arial; text-align: center; padding: 50px; }
                        .error-code { font-size: 72px; color: #e74c3c; }
                        .error-message { font-size: 24px; color: #7f8c8d; }
                    </style>
                </head>
                <body>
                    <div class="error-code">${statusCode}</div>
                    <div class="error-message">${message}</div>
                    <p>Request ID: ${Date.now()}</p>
                </body>
                </html>
            `);
        }, 20);
    });
}

app.use(interceptByStatusCode([404, 500], async (req, res, statusCode, content) => {
    try {
        const acceptsHtml = req.accepts('html');
        
        if (acceptsHtml) {
            const messages = {
                404: 'Page Not Found',
                500: 'Internal Server Error'
            };
            
            const errorPage = await renderErrorTemplate(statusCode, messages[statusCode]);
            res.respond(statusCode, errorPage, 'text/html');
        } else {
            // JSON error response with additional async data
            const errorDetails = await fetchErrorDetails(statusCode);
            
            res.respond(statusCode, {
                error: true,
                statusCode,
                message: content,
                details: errorDetails,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        winston.error('Error rendering error page:', error);
        res.respond(statusCode, content);
    }
}));

async function fetchErrorDetails(statusCode) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                documentation: `https://docs.example.com/errors/${statusCode}`,
                supportContact: 'support@example.com'
            });
        }, 10);
    });
}

// ============================================================================
// 4. Sample Routes
// ============================================================================

app.get('/api/user/:id', (req, res) => {
    res.json({
        userId: req.params.id,
        message: 'User data will be enriched with profile and stats'
    });
});

app.get('/api/products', async (req, res) => {
    const products = [
        { id: 1, name: 'Product A', price: 29.99 },
        { id: 2, name: 'Product B', price: 49.99 }
    ];
    
    res.json({ products });
});

app.get('/404-test', (req, res) => {
    res.status(404).send('Not found');
});

app.get('/error-test', (req, res) => {
    res.status(500).send('Server error');
});

// ============================================================================
// 5. Start Server
// ============================================================================

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
    console.log(`\n🚀 Advanced async example server running on http://localhost:${PORT}`);
    console.log('\nTry these endpoints:');
    console.log(`  - http://localhost:${PORT}/api/user/123`);
    console.log(`  - http://localhost:${PORT}/api/products`);
    console.log(`  - http://localhost:${PORT}/404-test`);
    console.log(`  - http://localhost:${PORT}/error-test\n`);
});
