# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Actively maintained |
| 1.9.x   | ⚠️ Critical fixes only |
| < 1.9   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public issue
2. Email: **[your-email@example.com]** with details
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 1 week
- **Fix Release:** Within 2 weeks for critical issues

## Security Measures in Place

- All user inputs sanitized via `JSON.stringify()` before CDP evaluation
- No raw string interpolation in `Runtime.evaluate` expressions
- CDP permissions scoped to page-level via `Browser.grantPermissions`
- Extension private key excluded from repository
- No external API calls or telemetry

## Scope

The following are in scope:
- XSS via selector/value injection
- CDP command injection
- Privilege escalation through extension APIs
- Data exfiltration through network interception
