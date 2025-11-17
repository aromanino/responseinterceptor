/**
 * Advanced Example: Custom Logging Configuration
 * ===============================================
 * 
 * This example demonstrates:
 * - Configuring custom logger (Winston, Bunyan, Pino, etc.)
 * - Disabling/enabling logging dynamically
 * - Logging different levels based on environment
 * - Integration with monitoring services (Datadog, New Relic, etc.)
 */

const express = require('express');
const { configure, intercept, interceptByStatusCode } = require('../index');

const app = express();
app.use(express.json());

// ============================================================================
// 1. Custom Logger Implementation
// ============================================================================

class CustomLogger {
    constructor() {
        this.logs = [];
    }
    
    log(...args) {
        const timestamp = new Date().toISOString();
        const message = args.join(' ');
        
        this.logs.push({ timestamp, level: 'info', message });
        
        // Send to external service (mock)
        this.sendToMonitoring('info', message);
        
        // Console output with color
        console.log(`\x1b[36m[${timestamp}]\x1b[0m`, message);
    }
    
    error(...args) {
        const timestamp = new Date().toISOString();
        const message = args.join(' ');
        
        this.logs.push({ timestamp, level: 'error', message });
        
        this.sendToMonitoring('error', message);
        
        console.error(`\x1b[31m[${timestamp}] ERROR:\x1b[0m`, message);
    }
    
    sendToMonitoring(level, message) {
        // Mock: In production, send to Datadog, New Relic, etc.
        // datadogClient.log({ level, message, service: 'api' });
    }
    
    getLogs() {
        return this.logs;
    }
    
    clearLogs() {
        this.logs = [];
    }
}

const customLogger = new CustomLogger();

// ============================================================================
// 2. Configure responseinterceptor with custom logger
// ============================================================================

configure({
    logging: {
        enabled: true,
        logger: (...args) => customLogger.log(...args)
    },
    errorHandling: {
        rethrow: false,
        onError: (err, req, res) => {
            customLogger.error(`Interceptor error on ${req.method} ${req.path}:`, err.message);
            
            // Send error to monitoring
            // Sentry.captureException(err);
        }
    }
});

// ============================================================================
// 3. Dynamic logging control endpoint
// ============================================================================

let loggingEnabled = true;

app.get('/admin/logging/toggle', (req, res) => {
    loggingEnabled = !loggingEnabled;
    
    configure({
        logging: {
            enabled: loggingEnabled,
            logger: (...args) => customLogger.log(...args)
        }
    });
    
    res.json({
        message: `Logging ${loggingEnabled ? 'enabled' : 'disabled'}`,
        loggingEnabled
    });
});

app.get('/admin/logs', (req, res) => {
    res.json({
        logs: customLogger.getLogs(),
        count: customLogger.getLogs().length
    });
});

app.delete('/admin/logs', (req, res) => {
    customLogger.clearLogs();
    res.json({ message: 'Logs cleared' });
});

// ============================================================================
// 4. Environment-based configuration
// ============================================================================

function configureLoggingForEnvironment(env) {
    const configs = {
        development: {
            logging: { enabled: true, logger: (...args) => customLogger.log(...args) },
            errorHandling: { rethrow: true }
        },
        production: {
            logging: { enabled: false, logger: () => {} },
            errorHandling: { 
                rethrow: false,
                onError: (err, req, res) => {
                    // Only log errors, not regular operations
                    customLogger.error('Production error:', err.message);
                }
            }
        },
        test: {
            logging: { enabled: false, logger: () => {} },
            errorHandling: { rethrow: true }
        }
    };
    
    return configure(configs[env] || configs.development);
}

// Set based on NODE_ENV
const currentEnv = process.env.NODE_ENV || 'development';
configureLoggingForEnvironment(currentEnv);

// ============================================================================
// 5. Interceptors with logging
// ============================================================================

app.use(intercept((body, header, req, respond) => {
    if (header.includes('application/json')) {
        customLogger.log(`Intercepting JSON response for ${req.method} ${req.path}`);
        
        body._meta = {
            intercepted: true,
            timestamp: new Date().toISOString(),
            environment: currentEnv
        };
    }
    
    respond(body);
}));

app.use(interceptByStatusCode([400, 401, 403, 404, 500], (req, res, statusCode, content) => {
    customLogger.error(`HTTP ${statusCode} on ${req.method} ${req.path}`);
    
    res.respond(statusCode, {
        error: true,
        statusCode,
        message: content,
        path: req.path,
        timestamp: new Date().toISOString()
    });
}));

// ============================================================================
// 6. Sample Routes
// ============================================================================

app.get('/api/data', (req, res) => {
    res.json({ message: 'This response will be intercepted and logged' });
});

app.get('/api/users', (req, res) => {
    res.json({
        users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ]
    });
});

app.get('/error', (req, res) => {
    res.status(500).send('Internal Server Error');
});

app.get('/forbidden', (req, res) => {
    res.status(403).send('Forbidden');
});

// ============================================================================
// 7. Request logging middleware
// ============================================================================

app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        customLogger.log(
            `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
        );
    });
    
    next();
});

// ============================================================================
// 8. Start Server
// ============================================================================

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    console.log(`\n🚀 Custom logging example server running on http://localhost:${PORT}`);
    console.log(`Environment: ${currentEnv}`);
    console.log(`Logging enabled: ${loggingEnabled}`);
    console.log('\nTry these endpoints:');
    console.log(`  - http://localhost:${PORT}/api/data`);
    console.log(`  - http://localhost:${PORT}/api/users`);
    console.log(`  - http://localhost:${PORT}/error`);
    console.log(`  - http://localhost:${PORT}/admin/logs`);
    console.log(`  - http://localhost:${PORT}/admin/logging/toggle\n`);
});
