# Security Considerations

## Classification

**UNCLASSIFIED // CUI** — This repository contains no classified material. Never commit classified data, real vulnerability scan results, PII, or operational network details.

## For Developers

### What You Must Do

- **Validate all input** on both client and server side
- **Use parameterized queries** (SQLAlchemy handles this)
- **Never hardcode secrets** — use environment variables
- **Run per-file security checks** after every code change
- **Keep dependencies updated** — check for CVEs regularly

### What You Must Not Do

- Commit secrets, tokens, passwords, or API keys
- Hardcode IP addresses or hostnames
- Disable security policies in `policies/`
- Bypass pre-commit hooks
- Store or log PII without encryption
- Use container images from non-Iron Bank registries

### Input Validation

Player names are validated on both client and server:
- 1-50 characters
- Pattern: `^[a-zA-Z0-9_ -]+$`
- This prevents XSS, SQL injection, and command injection

### Container Security

All containers follow IL5 requirements:
- Iron Bank hardened base images only
- Non-root user (UID 1001)
- Read-only root filesystem
- No privilege escalation
- CPU and memory limits enforced
- Health probes required

### Network Security

- Default deny network policies in Kubernetes
- Only explicitly allowed traffic flows
- TLS 1.3 for all external connections
- mTLS for intra-cluster communication (when service mesh is deployed)

### Audit Logging

Every API request produces a structured JSON audit log entry containing:
- UTC timestamp
- User identity (anonymous for this application)
- HTTP method and resource path
- Response status code
- Source IP address
- Request ID for correlation
- Request duration

Logs go to stdout and are captured by Fluentbit for centralized storage.
