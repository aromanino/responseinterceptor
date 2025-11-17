/**
 * Advanced Example: Configuration with PropertiesManager
 * =======================================================
 * 
 * This example demonstrates:
 * - Using propertiesmanager for configuration
 * - Loading config from custom.properties file
 * - Environment-specific configurations
 * - Dynamic configuration updates
 * - Integration with existing configuration systems
 */

const express = require('express');
const propertiesmanager = require('propertiesmanager').conf;
const { configure, getConfig, intercept, interceptByStatusCode } = require('../index');

const app = express();
app.use(express.json());

// ============================================================================
// 1. PropertiesManager - Automatic Configuration Loading
// ============================================================================

// PropertiesManager automatically loads config/default.json
// The file structure uses environments (production, test, dev)
// PropertiesManager reads NODE_ENV and returns the right config automatically
//
// Example config/default.json:
// {
//   "production": { "responseinterceptor": { "logging": { "enabled": false } } },
//   "test": { "responseinterceptor": { "logging": { "enabled": false } } },
//   "dev": { "responseinterceptor": { "logging": { "enabled": true } } }
// }

// Access configuration directly - propertiesmanager handles environment selection
console.log('\n========================================');
console.log('PropertiesManager Configuration');
console.log('========================================');
console.log('Current NODE_ENV:', process.env.NODE_ENV || 'dev (default)');
console.log('Loaded config:');
console.log('- logging.enabled:', propertiesmanager.responseinterceptor?.logging?.enabled);
console.log('- errorHandling.rethrow:', propertiesmanager.responseinterceptor?.errorHandling?.rethrow);
console.log('========================================\n');

const environment = process.env.NODE_ENV || 'dev';

// ============================================================================
// 2. Configure responseinterceptor
// ============================================================================

// Custom logger that uses your application's logger
const customLogger = (...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INTERCEPTOR]`, ...args);
};

// Configuration is already loaded from config/default.json by propertiesmanager
// You can override at runtime with configure()
configure({
    logging: {
        enabled: propertiesmanager.responseinterceptor?.logging?.enabled ?? true,
        logger: customLogger
    },
    errorHandling: {
        rethrow: propertiesmanager.responseinterceptor?.errorHandling?.rethrow ?? false,
        onError: (err, req, res) => {
            // Send to your error tracking service
            console.error('Interceptor error:', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method
            });
        }
    }
});

// ============================================================================
// 3. Dynamic Configuration Management
// ============================================================================

app.get('/admin/config', (req, res) => {
    const currentConfig = getConfig();
    res.json({
        config: {
            logging: {
                enabled: currentConfig.logging.enabled
            },
            errorHandling: {
                rethrow: currentConfig.errorHandling.rethrow
            }
        },
        propertiesmanager: {
            responseinterceptor: propertiesmanager.responseinterceptor
        }
    });
});

app.post('/admin/config/logging', (req, res) => {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
    }
    
    // Update runtime config (note: doesn't persist to file)
    configure({
        logging: { enabled }
    });
    
    res.json({
        message: `Logging ${enabled ? 'enabled' : 'disabled'}`,
        config: getConfig(),
        note: 'Runtime change only - not persisted to config/default.json'
    });
});

app.post('/admin/config/errorHandling', (req, res) => {
    const { rethrow } = req.body;
    
    if (typeof rethrow !== 'boolean') {
        return res.status(400).json({ error: 'rethrow must be a boolean' });
    }
    
    // Update runtime config
    configure({
        errorHandling: { rethrow }
    });
    
    res.json({
        message: `Error rethrow ${rethrow ? 'enabled' : 'disabled'}`,
        config: getConfig(),
        note: 'Runtime change only - not persisted to config/default.json'
    });
});

// ============================================================================
// 4. Use Interceptors with Configuration
// ============================================================================

app.use(intercept((body, header, req, respond) => {
    if (header.includes('application/json')) {
        // Add metadata
        body._meta = {
            timestamp: new Date().toISOString(),
            environment: environment,
            loggingEnabled: getConfig().logging.enabled
        };
    }
    respond(body);
}));

app.use(interceptByStatusCode([404, 500], (req, respond, statusCode, content) => {
    respond(statusCode, {
        error: true,
        statusCode,
        message: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        path: req.path,
        timestamp: new Date().toISOString()
    });
}));

// ============================================================================
// 5. Example Routes
// ============================================================================

app.get('/api/data', (req, res) => {
    res.json({
        data: 'Sample data',
        items: [1, 2, 3]
    });
});

app.get('/api/config-demo', (req, res) => {
    const config = getConfig();
    res.json({
        message: 'Configuration is managed via propertiesmanager',
        currentConfig: {
            loggingEnabled: config.logging.enabled,
            errorRethrow: config.errorHandling.rethrow
        },
        tips: [
            'Use POST /admin/config/logging to toggle logging',
            'Use POST /admin/config/errorHandling to toggle error rethrow',
            'Configuration persists in propertiesmanager',
            'Can be loaded from .properties files'
        ]
    });
});

app.get('/error-test', (req, res) => {
    res.status(500).send('Server error');
});

// ============================================================================
// 6. Configuration Persistence Example
// ============================================================================

// Save configuration to file (optional)
app.post('/admin/config/save', (req, res) => {
    try {
        // In a real application, you might want to save to a file
        // propertiesmanager.saveSync('./config/responseinterceptor.properties');
        
        res.json({
            message: 'Configuration saved',
            config: getConfig(),
            note: 'In this example, config is in-memory only'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to save configuration',
            details: error.message
        });
    }
});

// ============================================================================
// 7. Start Server
// ============================================================================

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
    console.log(`\n🚀 PropertiesManager config example running on http://localhost:${PORT}`);
    console.log(`Environment: ${environment}`);
    console.log(`Logging enabled: ${getConfig().logging.enabled}`);
    console.log('\nEndpoints:');
    console.log(`  - GET  http://localhost:${PORT}/api/data`);
    console.log(`  - GET  http://localhost:${PORT}/api/config-demo`);
    console.log(`  - GET  http://localhost:${PORT}/admin/config`);
    console.log(`  - POST http://localhost:${PORT}/admin/config/logging (body: {"enabled": true/false})`);
    console.log(`  - POST http://localhost:${PORT}/admin/config/errorHandling (body: {"rethrow": true/false})`);
    console.log(`  - POST http://localhost:${PORT}/admin/config/save\n`);
});
