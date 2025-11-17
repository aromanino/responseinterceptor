# responseinterceptor Examples

This directory contains practical examples demonstrating various use cases of the `responseinterceptor` package.

## Prerequisites

Make sure you have `responseinterceptor` installed:

```bash
npm install responseinterceptor
```

## Running Examples

Each example is a standalone Express application. Navigate to the `examples` directory and run:

```bash
node 01-basic-interception.js
# or
node 02-custom-error-pages.js
# or
node 03-conditional-by-role.js
# or
node 04-advanced-async.js
# or
node 05-custom-logging.js
# or
node 06-propertiesmanager-config.js
```

## Examples Overview

### 1. Basic Response Interception
**File**: `01-basic-interception.js`

Demonstrates:
- Global response interception
- Adding metadata to all JSON responses
- Timestamp and server information injection

**Use Case**: Add consistent metadata to all API responses

```bash
node 01-basic-interception.js
# Visit: http://localhost:3000/api/users
```

### 2. Custom Error Pages
**File**: `02-custom-error-pages.js`

Demonstrates:
- Status code-based interception (404, 500, 403)
- Custom HTML error pages
- JSON error responses with explicit Content-Type

**Use Case**: Professional error handling with branded error pages

```bash
node 02-custom-error-pages.js
# Visit: http://localhost:3001/nonexistent (404)
# Visit: http://localhost:3001/error (500)
# Visit: http://localhost:3001/forbidden (403)
```

### 3. Conditional Interception by User Role
**File**: `03-conditional-by-role.js`

Demonstrates:
- `interceptOnFly` for conditional logic
- Role-based data filtering
- Dynamic response modification based on user permissions

**Use Case**: Multi-tenant applications with role-based access

```bash
node 03-conditional-by-role.js

# Test with different roles:
curl http://localhost:3002/api/dashboard
curl -H "x-user-role: premium" http://localhost:3002/api/dashboard
curl -H "x-user-role: admin" http://localhost:3002/api/dashboard
```

### 4. Advanced Async/Await Operations
**File**: `04-advanced-async.js`

Demonstrates:
- Async/await in interceptor callbacks
- Database lookups and enrichment
- External API calls during interception
- Custom error handling configuration
- Performance monitoring
- Async template rendering for error pages

**Use Case**: Enriching responses with data from databases or external services

```bash
node 04-advanced-async.js

# Test endpoints:
curl http://localhost:3004/api/user/123
curl http://localhost:3004/api/products
curl http://localhost:3004/404-test
```

### 5. Custom Logging Configuration
**File**: `05-custom-logging.js`

Demonstrates:
- Custom logger implementation
- Dynamic logging control (enable/disable at runtime)
- Environment-based configuration
- Integration with monitoring services
- Request/response logging
- Log viewing and management endpoints

**Use Case**: Production logging with Winston/Bunyan/Pino or monitoring services

```bash
node 05-custom-logging.js

# Test endpoints:
curl http://localhost:3005/api/data
curl http://localhost:3005/admin/logs
curl http://localhost:3005/admin/logging/toggle
```

### 6. PropertiesManager Configuration
**File**: `06-propertiesmanager-config.js`

Demonstrates:
- Integration with propertiesmanager for configuration
- Loading config from .properties files
- Environment-specific configurations
- Dynamic configuration updates via API
- Configuration persistence
- Runtime config management with `getConfig()`

**Use Case**: Enterprise applications with centralized configuration management

```bash
node 06-propertiesmanager-config.js

# Test endpoints:
curl http://localhost:3006/api/config-demo
curl http://localhost:3006/admin/config
curl -X POST http://localhost:3006/admin/config/logging -H "Content-Type: application/json" -d '{"enabled": false}'
curl -X POST http://localhost:3006/admin/config/save
```

## Example Patterns

### Pattern 1: Global Middleware
Use when you want to intercept all responses:

```javascript
app.use(responseinterceptor.intercept((body, contentType, req, callback) => {
    // Modify response
    callback(modifiedBody);
}));
```

### Pattern 2: Status Code Handling
Use when you want to customize error responses:

```javascript
app.use(responseinterceptor.interceptByStatusCode([404, 500], (req, respond) => {
    respond(statusCode, customContent);
}));
```

### Pattern 3: Conditional Interception
Use when you need dynamic, request-specific logic:

```javascript
app.get('/api/data', (req, res) => {
    if (someCondition) {
        responseinterceptor.interceptOnFly(req, res, (body, contentType, req, callback) => {
            // Conditional modification
            callback(body);
        });
    }
    res.json(data);
});
```

### Pattern 4: Redirect Based on Error
Use when you want to redirect users on specific errors:

```javascript
app.use(responseinterceptor.interceptByStatusCodeRedirectTo(403, (req, redirect) => {
    if (req.user) {
        redirect('/no-access');
    } else {
        redirect('/login');
    }
}));
```

## Common Use Cases

### API Response Standardization
Add standard fields to all API responses:
- Timestamps
- Request IDs
- API version
- Server information

### Error Handling
- Custom error pages
- Consistent error format
- Error tracking and logging
- User-friendly error messages

### Security & Access Control
- Remove sensitive fields based on user role
- Add user-specific data
- Filter response based on permissions
- Audit logging

### Content Transformation
- Modify HTML content
- Transform data formats
- Add analytics tracking
- Inject scripts or styles

## Tips & Best Practices

1. **Performance**: Use `interceptOnFly` for conditional logic to avoid unnecessary overhead

2. **Error Handling**: Always handle errors in your callbacks to prevent crashes

3. **Content-Type**: Be explicit with Content-Type when serving custom formats

4. **Testing**: Test your interceptors with different content types and edge cases

5. **Logging**: Use `NODE_ENV=production` to disable development logging

## Need Help?

- Check the main [README.md](../README.md)
- Review the [API documentation](../README.md#reference)
- Open an issue on [GitHub](https://github.com/aromanino/responseinterceptor/issues)

## Contributing

Have a useful example? Feel free to submit a pull request! See [CONTRIBUTING.md](../CONTRIBUTING.md).
