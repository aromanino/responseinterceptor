# Contributing to responseinterceptor

First off, thank you for considering contributing to `responseinterceptor`! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to a.romanino@gmail.com.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (Node version, OS, Express version)
- **Code samples** or test cases if possible

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Use case**: Why is this enhancement needed?
- **Proposed solution**: How would you implement it?
- **Alternatives considered**: What other approaches did you think about?
- **Impact**: Who benefits from this enhancement?

### Pull Requests

We actively welcome pull requests! 

1. Fork the repo and create your branch from `master`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write a clear commit message

## Development Setup

### Prerequisites

- Node.js >= 14.x
- npm >= 6.x

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/responseinterceptor.git
cd responseinterceptor

# Install dependencies
npm install

# Run tests
npm test
```

### Project Structure

```
responseinterceptor/
├── index.js              # Main module
├── test/                 # Test files
│   ├── intercept.test.js
│   ├── interceptByStatusCode.test.js
│   ├── validation.test.js
│   └── ...
├── README.md
├── SECURITY.md
└── package.json
```

## Pull Request Process

1. **Branch Naming**: Use descriptive names
   - `feature/add-async-support`
   - `fix/memory-leak-in-buffer-handling`
   - `docs/improve-readme-examples`

2. **Update Tests**: Add or update tests for your changes

3. **Update Documentation**: Update README.md if needed

4. **Run Tests**: Ensure all tests pass
   ```bash
   npm test
   ```

5. **Commit**: Write clear, concise commit messages

6. **Push**: Push to your fork

7. **Open PR**: Create a pull request with:
   - Clear title
   - Description of changes
   - Reference to related issues
   - Screenshots (if applicable)

## Coding Standards

### JavaScript Style

- Use **4 spaces** for indentation (not tabs)
- Use **single quotes** for strings
- Add **semicolons** at the end of statements
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Keep lines under **120 characters** when possible

### Example

```javascript
function setContentTypeHeader(content, res, explicitContentType) {
    if (explicitContentType) {
        res.setHeader('Content-Type', explicitContentType);
        return;
    }
    
    if (typeof content === 'object' && content !== null) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
}
```

### Comments

- Use JSDoc for function documentation
- Add inline comments for complex logic
- Keep comments up-to-date with code changes

```javascript
/**
 * Helper function to determine and set appropriate Content-Type header
 * @param {*} content - The content to analyze
 * @param {object} res - Express response object
 * @param {string} [explicitContentType] - Optional explicit Content-Type to use
 */
function setContentTypeHeader(content, res, explicitContentType) {
    // Implementation
}
```

## Testing Guidelines

### Test Structure

- One test file per module
- Use descriptive `describe()` blocks
- Use clear `it()` descriptions
- Test both success and error cases

### Example Test

```javascript
describe('interceptByStatusCode()', function() {
    describe('Parameter Validation', function() {
        it('should throw TypeError when statusCodes is null', function() {
            expect(() => {
                interceptByStatusCode(null, () => {});
            }).to.throw(TypeError, 'statusCodes must be a number or an array of numbers');
        });
    });
    
    describe('Functionality', function() {
        it('should intercept 404 responses', function(done) {
            // Test implementation
        });
    });
});
```

### Test Coverage

- Aim for >90% coverage
- Test edge cases (null, undefined, empty values)
- Test error handling
- Test performance-critical paths

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx mocha test/validation.test.js

# Run with coverage (if configured)
npm run coverage
```

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(intercept): add async/await support for callbacks

- Modify callback signature to support async functions
- Update tests to verify async behavior
- Add documentation for async usage

Closes #123
```

```
fix(buffer): correct Content-Type detection for large buffers

The Buffer.isBuffer() check was not being performed before
string operations, causing errors with large binary content.

Fixes #456
```

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Push to npm
5. Create GitHub release

## Questions?

Feel free to:
- Open an issue for discussion
- Email a.romanino@gmail.com
- Check existing documentation

---

**Thank you for contributing!** 🎉
