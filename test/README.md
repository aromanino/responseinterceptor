# Test Suite for responseinterceptor

This directory contains comprehensive test modules for the `responseinterceptor` package.

## Test Files

- **intercept.test.js** - Tests for the `intercept()` function
  - JSON response interception
  - HTML response interception
  - Multiple routes interception
  - ETag support
  - Content-Length handling
  - Empty response handling

- **interceptOnFly.test.js** - Tests for the `interceptOnFly()` function
  - Conditional interception based on query parameters
  - User role-based interception
  - Dynamic content modification
  - Multiple conditional checks
  - HTML content interception

- **interceptByStatusCode.test.js** - Tests for the `interceptByStatusCode()` function
  - 404 Not Found interception
  - 500 Internal Server Error interception
  - Multiple status codes interception
  - Custom HTML error pages
  - Content type handling
  - Infinite loop prevention

- **interceptByStatusCodeRedirectTo.test.js** - Tests for the `interceptByStatusCodeRedirectTo()` function
  - Static redirect URLs
  - Dynamic redirects with callback functions
  - Multiple status codes redirect
  - Request information preservation
  - External redirects
  - Query string preservation

- **buffer-and-errors.test.js** - Tests for Buffer support and error handling
  - Buffer content with auto-detected Content-Type
  - Buffer with explicit Content-Type
  - Large Buffer content
  - Error handling in callbacks
  - Null and undefined content handling

- **validation.test.js** - Tests for parameter validation
  - Status code validation (number, array, invalid values)
  - Callback validation (function type, non-function rejection)
  - URL validation for redirects
  - Edge cases and error messages

- **configuration.test.js** - Tests for `configure()` and `getConfig()`
  - Custom logger configuration
  - Logging enable/disable
  - Custom error handlers
  - Error rethrow configuration
  - Partial updates
  - Integration with interceptors
  - PropertiesManager integration

- **performance.test.js** - Performance benchmarks
  - Global intercept overhead
  - Status code intercept performance
  - Content-Type detection speed
  - Large payload handling
  - Multiple interceptors chaining

## Running Tests

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npx mocha test/intercept.test.js
npx mocha test/interceptOnFly.test.js
npx mocha test/interceptByStatusCode.test.js
npx mocha test/interceptByStatusCodeRedirectTo.test.js
```

Run with verbose output:
```bash
npm test -- --reporter spec
```

## Test Coverage

The test suite covers:
- All 4 exported functions from the main module
- Various response types (JSON, HTML, text)
- Different HTTP status codes (200, 403, 404, 500)
- Edge cases (empty responses, infinite loops, content type handling)
- Request context access and preservation
- Conditional and dynamic behavior

## Dependencies

- **mocha** - Test framework
- **chai** - Assertion library
- **supertest** - HTTP testing library
