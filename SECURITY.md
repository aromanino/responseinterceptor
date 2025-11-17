# Security Policy

## Supported Versions

We actively support the following versions of `responseinterceptor` with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in `responseinterceptor`, please report it responsibly.

### How to Report

**Please DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities by emailing:

📧 **a.romanino@gmail.com**

Include in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Potential impact
- Any suggested fixes (optional)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within **48 hours**.

2. **Assessment**: We will assess the vulnerability and determine its severity within **5 business days**.

3. **Fix Development**: If the vulnerability is confirmed, we will:
   - Develop a fix
   - Test the fix thoroughly
   - Prepare a security advisory

4. **Disclosure**: Once a fix is ready:
   - We will release a patch version
   - We will publish a security advisory
   - We will credit you for the discovery (unless you prefer to remain anonymous)

### Security Best Practices

When using `responseinterceptor`, follow these best practices:

1. **Keep Updated**: Always use the latest version to benefit from security patches.

2. **Validate Inputs**: Always validate and sanitize data in your interceptor callbacks.

3. **Error Handling**: Implement proper error handling in your callbacks to prevent information leakage.

4. **Content-Type**: Be explicit about Content-Type when handling sensitive data.

5. **Production Logging**: Ensure `NODE_ENV=production` to disable development logging.

### Known Security Considerations

#### 1. Callback Errors
- Exceptions in user callbacks are caught and logged
- Original response continues to prevent crashes
- Ensure your callbacks handle errors gracefully

#### 2. Content-Type Detection
- Automatic Content-Type detection is heuristic-based
- For sensitive content, always specify explicit Content-Type
- Be aware that malformed content may be misdetected

#### 3. Infinite Loop Prevention
- The `__interceptHandled` flag prevents recursive interception
- Do not manually modify this flag
- Avoid calling `res.send()` multiple times in callbacks

#### 4. Buffer Handling
- Buffer content defaults to `application/octet-stream`
- Always specify explicit Content-Type for binary data
- Be cautious with large buffers to prevent memory issues

### Security Audit

Run `npm audit` regularly to check for vulnerabilities in dependencies:

```bash
npm audit
npm audit fix  # Auto-fix vulnerabilities when possible
```

### Dependency Security

We regularly monitor and update dependencies to address security vulnerabilities. Dependencies include:

- `etag` - For ETag generation
- Express compatibility (peer dependency)

### Contact

For general security questions or concerns:
- Email: a.romanino@gmail.com
- GitHub: [@aromanino](https://github.com/aromanino)

---

**Thank you for helping keep `responseinterceptor` secure!** 🔒
