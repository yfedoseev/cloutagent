# Security Guidelines

## Overview

This document outlines security best practices for development and deployment.

## Code Security

### 1. Input Validation

**Always validate and sanitize user inputs:**

```python
# Bad
user_input = request.get('data')
eval(user_input)  # Never do this!

# Good
from marshmallow import Schema, fields, ValidationError

class UserInputSchema(Schema):
    data = fields.Str(required=True, validate=validate.Length(max=100))

try:
    result = UserInputSchema().load(request.json)
    process_safe_input(result['data'])
except ValidationError as err:
    return {'errors': err.messages}, 400
```

```typescript
// Bad
const userInput = req.body.data;
eval(userInput); // Never do this!

// Good
import Joi from 'joi';

const schema = Joi.object({
  data: Joi.string().max(100).required()
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details });
}
processSafeInput(value.data);
```

### 2. SQL Injection Prevention

**Use parameterized queries:**

```python
# Bad
query = f"SELECT * FROM users WHERE id = {user_id}"
cursor.execute(query)

# Good
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

```typescript
// Bad
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Good
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

### 3. XSS Prevention

**Escape user content:**

```javascript
// Bad
element.innerHTML = userInput;

// Good
element.textContent = userInput;
// Or use a sanitization library like DOMPurify
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 4. Authentication & Authorization

**Implement proper auth:**

```python
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        return f(*args, **kwargs)
    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            user = get_jwt_identity()
            if user.get('role') != role:
                return {'error': 'Insufficient permissions'}, 403
            return f(*args, **kwargs)
        return decorated
    return decorator
```

## Environment Security

### 1. Environment Variables

**Never commit secrets:**

```bash
# .env (never commit this file)
DATABASE_URL=postgresql://user:pass@localhost/db
API_KEY=sk-abc123def456ghi789
JWT_SECRET=your-super-secret-jwt-key

# .env.example (commit this template)
DATABASE_URL=postgresql://user:pass@localhost/db
API_KEY=your-api-key-here
JWT_SECRET=your-jwt-secret-here
```

### 2. Configuration Management

```python
import os
from typing import Optional

class Config:
    """Secure configuration management."""

    DATABASE_URL: str = os.environ.get('DATABASE_URL', '')
    API_KEY: str = os.environ.get('API_KEY', '')
    JWT_SECRET: str = os.environ.get('JWT_SECRET', '')
    DEBUG: bool = os.environ.get('DEBUG', '').lower() == 'true'

    @classmethod
    def validate(cls) -> None:
        """Validate required environment variables."""
        required = ['DATABASE_URL', 'API_KEY', 'JWT_SECRET']
        missing = [var for var in required if not getattr(cls, var)]
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
```

## API Security

### 1. Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/sensitive')
@limiter.limit("5 per minute")
def sensitive_endpoint():
    return {'data': 'sensitive info'}
```

### 2. CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 3. Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Database Security

### 1. Connection Security

```python
# Use SSL connections
DATABASE_URL = "postgresql://user:pass@host:5432/db?sslmode=require"

# Connection pooling with limits
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### 2. Query Security

```python
# Use ORM when possible
user = session.query(User).filter(User.id == user_id).first()

# If raw SQL is needed, use parameters
result = session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)
```

## Dependency Security

### 1. Regular Updates

```bash
# Check for vulnerabilities
npm audit
uv audit  # or pip-audit

# Update dependencies
npm update
uv sync --upgrade

# Check for outdated packages
npm outdated
uv tree --outdated
```

### 2. Lock Files

```bash
# Always commit lock files
git add package-lock.json
git add uv.lock

# Use exact versions for security-critical dependencies
npm install --save-exact some-security-package
```

## Deployment Security

### 1. HTTPS Only

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
}
```

### 2. Container Security

```dockerfile
# Use non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# Use specific versions
FROM node:18.20.0-alpine

# Remove unnecessary packages
RUN apk del package-to-remove

# Scan for vulnerabilities
# docker scout cves local://image-name
```

## Secrets Management

### 1. Development

```bash
# Use direnv for local development
echo "export API_KEY=your-dev-key" > .envrc
direnv allow

# Or use docker secrets
echo "my-secret" | docker secret create api-key -
```

### 2. Production

```bash
# Use external secret management
# AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, etc.

# Environment-specific secrets
kubectl create secret generic app-secrets \
  --from-literal=api-key=prod-key \
  --from-literal=db-password=prod-password
```

## Monitoring & Logging

### 1. Security Logging

```python
import logging
from datetime import datetime

security_logger = logging.getLogger('security')

def log_security_event(event_type: str, user_id: str, details: dict):
    """Log security-related events."""
    security_logger.warning({
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'user_id': user_id,
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent'),
        'details': details
    })

# Usage
@app.route('/login', methods=['POST'])
def login():
    # ... authentication logic ...
    if failed:
        log_security_event('login_failed', user_id, {'reason': 'invalid_password'})
        return {'error': 'Invalid credentials'}, 401

    log_security_event('login_success', user_id, {})
    return {'token': generate_token(user)}
```

### 2. Error Handling

```python
@app.errorhandler(Exception)
def handle_error(error):
    """Handle errors without exposing sensitive information."""
    # Log the full error internally
    app.logger.error(f"Unhandled error: {error}", exc_info=True)

    # Return generic error to client
    return {
        'error': 'An internal error occurred',
        'request_id': generate_request_id()
    }, 500
```

## Security Checklist

### Development
- [ ] Input validation implemented
- [ ] SQL injection protection in place
- [ ] XSS prevention measures
- [ ] Authentication and authorization working
- [ ] Secrets not in code
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Error handling secure

### Deployment
- [ ] HTTPS enforced
- [ ] Security headers active
- [ ] Rate limiting in place
- [ ] Monitoring and logging configured
- [ ] Secrets properly managed
- [ ] Container security measures
- [ ] Database connections secured
- [ ] Regular security scans scheduled

## Tools & Resources

### Static Analysis
- **ESLint**: JavaScript security rules
- **Bandit**: Python security scanner
- **Semgrep**: Multi-language security scanner

### Dependency Scanning
- **npm audit**: Node.js vulnerabilities
- **Safety**: Python vulnerabilities
- **Snyk**: Multi-language dependency scanning

### Secret Scanning
- **detect-secrets**: Pre-commit secret detection
- **GitGuardian**: Git repository scanning
- **GitHub Secret Scanning**: Built-in GitHub feature

### Runtime Security
- **OWASP ZAP**: Web application scanner
- **Burp Suite**: Web security testing
- **Nmap**: Network security scanning

## Incident Response

### 1. Immediate Actions
1. **Isolate** affected systems
2. **Assess** the scope of impact
3. **Notify** relevant stakeholders
4. **Document** all actions taken

### 2. Investigation
1. **Preserve** evidence
2. **Analyze** logs and traces
3. **Identify** root cause
4. **Implement** fixes

### 3. Recovery
1. **Validate** fixes
2. **Monitor** for recurrence
3. **Update** security measures
4. **Conduct** post-incident review

Remember: Security is an ongoing process, not a one-time setup!