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
- **Update `component-definition.yaml`** when changing security-relevant functionality

### What You Must Not Do

- Commit secrets, tokens, passwords, or API keys
- Hardcode IP addresses or hostnames
- Disable security policies in `policies/`
- Bypass pre-commit hooks
- Store or log PII without encryption
- Use container images from unapproved registries (approved: `ghcr.io`, `cgr.dev`, `docker.io`)

### Input Validation

Player names are validated on both client and server:
- 1-50 characters
- Pattern: `^[a-zA-Z0-9_ -]+$`
- This prevents XSS, SQL injection, and command injection

### Container Security

All containers follow IL5 requirements:
- Chainguard distroless base images (`cgr.dev/chainguard/*`) with zero known CVEs
- Non-root users: app containers run as UID 65532 (Chainguard `nonroot`), PostgreSQL runs as UID 999
- Read-only root filesystem
- No privilege escalation (`allowPrivilegeEscalation: false`)
- All capabilities dropped
- CPU and memory limits enforced
- Liveness and readiness probes required
- Container scanning via Trivy on every build (CRITICAL/HIGH CVEs block the pipeline)
- Container signing via Cosign (keyless, OIDC-based)

### Kubernetes Admission Policies

Six Kyverno ClusterPolicies are deployed via Flux and enforce controls at admission time:

| Policy | Control | What It Enforces |
|--------|---------|-----------------|
| `require-labels` | CM-8 | All resources labeled for inventory |
| `restrict-registries` | SA-12, CM-7 | Only approved image registries |
| `require-non-root` | AC-6, CM-7 | Containers must run as non-root (database pods excluded) |
| `require-resource-limits` | SC-6 | CPU/memory limits mandatory |
| `require-probes` | SI-6 | Liveness/readiness probes required |
| `disallow-privileged` | AC-6 | No privileged containers or host namespaces |

Policies are stored in `policies/kyverno/` and deployed via `deploy/infrastructure/post-install/kustomization.yaml`.

### Network Security

- Default-deny NetworkPolicy blocks all traffic by default
- Per-service NetworkPolicies allow only required flows:
  - `ingress-nginx` → `web-ui:8080`
  - `ingress-nginx` / `web-ui` → `agent-runtime:8000`
  - `agent-runtime` → `postgresql:5432`
  - All services → DNS (`kube-dns:53`)
- TLS 1.3 for all external connections (via ingress-nginx + cert-manager)
- mTLS for intra-cluster communication (when service mesh is deployed)

### Infrastructure Encryption (Sentinel)

Terraform Sentinel policy (`policies/sentinel/enforce-encryption.sentinel`) enforces encryption at rest for Azure resources:
- Azure Managed Disks must have encryption enabled
- Azure PostgreSQL Flexible Servers must have storage encryption
- Azure Storage Accounts must enforce TLS 1.2+ and infrastructure encryption

### Audit Logging

Every API request produces a structured JSON audit log entry containing:
- UTC timestamp
- User identity (anonymous for this application)
- HTTP method and resource path
- Response status code
- Source IP address
- Request ID for correlation
- Request duration

Logs go to stdout and are captured by the cluster logging infrastructure.

## Compliance Artifacts

The project generates and maintains OSCAL compliance artifacts:

| Artifact | Location | Purpose |
|----------|----------|---------|
| Component definitions | `apps/*/component-definition.yaml` | Per-app control implementation narratives |
| System component def | `compliance/component-definitions/system-component-def.json` | Aggregated system-level definition |
| System Security Plan | `compliance/system-security-plan/ssp.md` | Auto-generated SSP |
| Plan of Action & Milestones | `compliance/poam/poam.json` | Findings tracking |
| C2P mapping | `compliance/c2p-config.yaml` | OSCAL control → Kyverno/OPA policy mapping |

Generate artifacts locally with:
```bash
./scripts/compliance/generate-ssp.sh    # SSP + system component-def
./scripts/compliance/generate-poam.sh   # POA&M
```
