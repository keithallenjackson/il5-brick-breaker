# AGENTS.md — Project Sentinel

> Agentic AI Platform for DoD IL5 Environments with Automated RMF/eMASS Compliance

This file is the authoritative guide for any AI coding agent working in this repository. Read it fully before writing code. It applies to Claude Code, Cursor, Copilot, Cline, Windsurf, and any other agentic coding tool.

---

## Project Identity

**Project Sentinel** is a containerized, Kubernetes-native agentic AI platform designed for deployment into DoD Impact Level 5 (CUI/NSS) environments. The platform hosts mission-specific AI agents that connect to enterprise tools via Model Context Protocol (MCP), with compliance artifacts generated automatically from the codebase and infrastructure definitions.

The system must achieve and maintain a Continuous Authority to Operate (cATO) posture. Every line of code, every infrastructure definition, and every configuration change is a compliance artifact.

**Classification Reminder:** This repository contains NO classified material. All code is UNCLASSIFIED // CUI. Never commit classified data, FOUO markings with actual sensitive content, real vulnerability scan results, PII, or operational network details.

---

## Architecture Overview

```
repo-root/
├── AGENTS.md                          # You are here
├── README.md                          # Human-facing project overview
├── .gitattributes                     # LFS, line endings
├── .pre-commit-config.yaml            # Pre-commit hooks (secrets, lint, OSCAL validate)
│
├── apps/                              # Application source code
│   ├── agent-runtime/                 # Core agentic AI orchestrator (Python)
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── component-definition.yaml  # OSCAL component def for this app
│   ├── mcp-gateway/                   # MCP server broker/proxy (TypeScript)
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── component-definition.yaml
│   ├── compliance-engine/             # RMF artifact generator (Python)
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── component-definition.yaml
│   └── web-ui/                        # Mission operator dashboard (React/TS)
│       ├── src/
│       ├── tests/
│       ├── Dockerfile
│       └── component-definition.yaml
│
├── infrastructure/                    # Infrastructure-as-Code
│   ├── terraform/                     # Cloud infra (GovCloud)
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   └── backend.tf
│   └── ansible/                       # Configuration management
│       ├── playbooks/
│       └── roles/
│
├── deploy/                            # GitOps deployment manifests (Kustomize)
│   ├── base/                          # Base K8s manifests
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── agent-runtime/
│   │   ├── mcp-gateway/
│   │   ├── compliance-engine/
│   │   └── web-ui/
│   ├── overlays/                      # Environment-specific overrides
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   └── flux-system/                   # Flux CD GitOps operator config
│       ├── gotk-components.yaml
│       ├── gotk-sync.yaml
│       └── kustomization.yaml
│
├── policies/                          # Policy-as-Code
│   ├── opa/                           # Open Policy Agent / Gatekeeper policies
│   │   ├── admission/                 # K8s admission control
│   │   ├── pipeline/                  # CI/CD gate policies
│   │   └── data/                      # Policy data bundles
│   ├── kyverno/                       # Kyverno cluster policies
│   │   ├── require-labels.yaml
│   │   ├── restrict-registries.yaml   # Iron Bank only
│   │   ├── require-non-root.yaml
│   │   └── require-resource-limits.yaml
│   └── sentinel/                      # Terraform Sentinel policies
│       └── enforce-encryption.sentinel
│
├── compliance/                        # Compliance-as-Code (OSCAL)
│   ├── catalogs/                      # OSCAL catalogs (NIST 800-53 Rev5)
│   │   └── nist-800-53-rev5.json
│   ├── profiles/                      # OSCAL profiles (baselines)
│   │   ├── fedramp-high.json
│   │   ├── dod-il5.json              # IL5 = FedRAMP High + FedRAMP+ + NSS overlays
│   │   └── project-sentinel.json      # Project-specific profile
│   ├── component-definitions/         # Aggregated from apps/*/component-definition.yaml
│   │   └── system-component-def.json
│   ├── system-security-plan/          # Auto-generated SSP
│   │   ├── ssp.json                   # OSCAL JSON (machine-readable)
│   │   └── ssp.md                     # Markdown for human review
│   ├── assessment-plans/
│   ├── assessment-results/            # CI/CD pipeline scan results mapped to controls
│   ├── poam/                          # Plan of Action & Milestones
│   ├── trestle-config.yaml            # Compliance-trestle workspace config
│   └── c2p-config.yaml               # Compliance-to-Policy mapping config
│
├── pipeline/                          # CI/CD pipeline definitions
│   ├── .github/                       # GitHub Actions (if using GitHub)
│   │   └── workflows/
│   │       ├── ci.yaml                # Continuous Integration
│   │       ├── security-scan.yaml     # SAST/DAST/SCA
│   │       ├── compliance-check.yaml  # OSCAL validation + STIG check
│   │       ├── build-publish.yaml     # Container build + sign + push
│   │       └── emass-sync.yaml        # eMASS API sync
│   └── tekton/                        # Tekton pipelines (if on Platform One)
│       ├── pipelines/
│       └── tasks/
│
├── scripts/                           # Automation scripts
│   ├── compliance/
│   │   ├── generate-ssp.sh            # Runs trestle to build SSP from components
│   │   ├── generate-poam.sh           # Builds POA&M from scan results
│   │   ├── sync-emass.py              # Push OSCAL artifacts to eMASS via API
│   │   ├── validate-oscal.sh          # Validate all OSCAL documents
│   │   └── stig-check.sh             # Run OpenSCAP STIG checks
│   ├── security/
│   │   ├── scan-secrets.sh
│   │   ├── generate-sbom.sh           # Syft SBOM generation
│   │   └── sign-artifact.sh           # Cosign container signing
│   └── dev/
│       ├── setup-local.sh
│       └── run-tests.sh
│
├── docs/                              # Project documentation
│   ├── architecture/
│   │   ├── adr/                       # Architecture Decision Records
│   │   └── diagrams/
│   ├── runbooks/
│   ├── onboarding.md
│   └── security.md                    # Security considerations for developers
│
└── tests/                             # Integration / E2E tests
    ├── integration/
    └── e2e/
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language (backend) | Python 3.12+ | Agent runtime, compliance engine |
| Language (gateway) | TypeScript 5.x / Node 22 LTS | MCP gateway |
| Language (frontend) | React 19 + TypeScript | Operator dashboard |
| Container Runtime | Kubernetes 1.30+ (CNCF certified) | Platform One Big Bang compatible |
| Container Registry | Iron Bank (registry1.dso.mil) | Hardened base images only |
| GitOps Operator | Flux CD v2 | Pull-based reconciliation |
| Policy Engine | Kyverno + OPA/Gatekeeper | Admission control + CI gates |
| Compliance SDK | compliance-trestle (OSCAL Compass) | CNCF sandbox project |
| Compliance Bridge | compliance-to-policy (C2P) | OSCAL → Kyverno/OPA policy mapping |
| OSCAL Version | 1.1.2+ | NIST standard for compliance artifacts |
| IaC | Terraform 1.9+ | GovCloud infrastructure |
| Config Management | Ansible | OS-level hardening, STIG application |
| Secret Management | HashiCorp Vault (or SOPS + age) | FIPS 140-3 validated encryption |
| SBOM | Syft (CycloneDX format) | Software Bill of Materials |
| Container Signing | Cosign (Sigstore) | Supply chain integrity |
| CI/CD | GitHub Actions or Tekton | Pipeline definitions in `pipeline/` |
| Monitoring | Prometheus + Grafana (Big Bang) | Runtime observability |
| Logging | Fluentbit → Elasticsearch (Big Bang) | Centralized audit logging |

---

## Commands

### Per-File (Fast — Run These Frequently)

```bash
# Python type check single file
mypy --strict apps/agent-runtime/src/path/to/file.py

# Python lint single file
ruff check apps/agent-runtime/src/path/to/file.py --fix

# Python format single file
ruff format apps/agent-runtime/src/path/to/file.py

# TypeScript type check single file
npx tsc --noEmit apps/mcp-gateway/src/path/to/file.ts

# TypeScript lint single file
npx eslint apps/mcp-gateway/src/path/to/file.ts --fix

# Run a single Python test
pytest apps/agent-runtime/tests/test_specific.py -x -v

# Run a single TS test
npx vitest run apps/mcp-gateway/tests/specific.test.ts

# Validate a single OSCAL document
trestle validate -f compliance/profiles/dod-il5.json

# Validate a single Kyverno policy
kyverno validate policy policies/kyverno/require-labels.yaml
```

### Project-Wide (Slow — Only When Explicitly Requested or Pre-Commit)

```bash
# Full Python test suite
make test-python

# Full TypeScript test suite
make test-typescript

# Full lint pass
make lint

# Full OSCAL validation
make validate-oscal

# Generate SSP from all component definitions
make generate-ssp

# Generate SBOM for all apps
make generate-sbom

# Full compliance pipeline (validate OSCAL + run STIG checks + generate SSP + generate POA&M)
make compliance-all

# Build all containers
make build

# Push OSCAL artifacts to eMASS
make emass-sync
```

### After Every Code Change

Always run per-file lint + type check + test for the file you changed. Do NOT run project-wide builds after every edit.

---

## Safety and Permissions

### Allowed Without Asking

- Read any file, list any directory
- Per-file lint, type check, format, test
- Validate OSCAL documents
- Create new files in `apps/`, `tests/`, `docs/`, `policies/`
- Edit existing application code and tests
- Run `trestle` commands for OSCAL manipulation

### Ask First

- Package installs (`pip install`, `npm install`)
- Any `git push`, `git rebase`, `git merge`
- Deleting files or directories
- Running project-wide builds or full test suites
- Modifying `deploy/` manifests for production overlay
- Modifying `infrastructure/terraform/environments/production/`
- Running `make emass-sync` (writes to external government system)
- Modifying Flux CD configuration in `deploy/flux-system/`
- Changing encryption keys, secrets, or Vault configuration

### Never Do

- Commit secrets, tokens, passwords, or API keys to any file
- Hardcode IP addresses, hostnames, or network topology details
- Add container base images from registries other than Iron Bank
- Disable or weaken any security policy in `policies/`
- Bypass pre-commit hooks
- Modify `.pre-commit-config.yaml` to remove security checks
- Write code that stores or logs PII without encryption
- Skip OSCAL component-definition updates when adding new functionality

---

## Development Rules

### Git Workflow (MinimumCD Trunk-Based Development)

This project follows the Minimum Viable Continuous Delivery practices defined at [minimumcd.org](https://minimumcd.org). Every agent must adhere to these:

1. **Trunk-based development.** The `main` branch is the trunk. All work integrates here.
2. **Short-lived branches only.** Feature branches must originate from `main`, re-integrate to `main`, and be deleted after merge. Maximum branch lifetime: 24 hours preferred, 48 hours hard limit.
3. **Work integrates to trunk daily minimum.** If a task takes more than a day, break it into smaller incremental commits that keep `main` green.
4. **Automated testing before merge.** Every PR must pass CI (lint, type check, unit tests, OSCAL validation, secret scan, SBOM generation) before merge.
5. **All work stops when main is red.** If CI on `main` fails, fixing it is the top priority. Do not stack new work on a broken trunk.
6. **The pipeline is the only path to deploy.** No manual deployments. No `kubectl apply` by hand. Everything goes through GitOps reconciliation via Flux CD.
7. **The pipeline decides releasability.** Its verdict is definitive. If the pipeline says no, the artifact does not ship.
8. **Immutable artifacts.** Once a container image is built and signed, no human modifies it. Tags are immutable. Use content-addressable digests.
9. **Rollback on demand.** Flux CD enables instant rollback by reverting a Git commit in `deploy/overlays/<env>/`. Test this capability regularly.

### Commit Messages

Use Conventional Commits. The compliance engine parses these to map changes to RMF control families.

```
<type>(<scope>): <description>

[optional body]

[optional footer: OSCAL-CONTROL: XX-## or BREAKING CHANGE]
```

Types: `feat`, `fix`, `security`, `compliance`, `docs`, `refactor`, `test`, `ci`, `chore`

Scopes: `agent-runtime`, `mcp-gateway`, `compliance-engine`, `web-ui`, `infra`, `policy`, `deploy`, `oscal`

Footer `OSCAL-CONTROL` maps the change to a NIST 800-53 control (optional but encouraged). Examples:

```
feat(agent-runtime): add MCP tool authentication middleware

Implements OAuth2 bearer token validation for all inbound MCP tool
calls. Tokens are validated against the IdP before tool execution.

OSCAL-CONTROL: IA-2, IA-5
```

```
security(mcp-gateway): enforce TLS 1.3 minimum for all MCP connections

OSCAL-CONTROL: SC-8, SC-13
```

```
compliance(oscal): update AC-2 implementation narrative for agent-runtime

Updates the component-definition to reflect the new RBAC configuration
deployed in commit abc1234.
```

### Commit Signing

All commits MUST be GPG signed. Configure:

```bash
git config commit.gpgsign true
```

Unsigned commits will be rejected by pre-commit hooks. This supports NIST 800-53 controls AU-10 (Non-Repudiation) and CM-5 (Access Restrictions for Change).

---

## Compliance-as-Code Rules

This is the most critical section. Every agent must understand and follow these rules. The compliance system is NOT optional documentation — it is a functioning automated pipeline that generates real government paperwork.

### How It Works

```
Developer writes code
    ↓
Code includes OSCAL component-definition.yaml (per app)
    ↓
CI pipeline validates component-definitions against profiles
    ↓
compliance-trestle aggregates all component-definitions into system-level SSP
    ↓
Pipeline scan results (SAST, DAST, SCA, STIG) are converted to OSCAL Assessment Results
    ↓
C2P (compliance-to-policy) maps OSCAL controls → Kyverno/OPA policies
    ↓
Kyverno policies are deployed to cluster via GitOps
    ↓
Assessment results + SSP + POA&M are synced to eMASS via API
    ↓
ConMon dashboard reflects live compliance posture
```

### Component Definition Files

Every application in `apps/` has a `component-definition.yaml`. When you add new functionality that implements, modifies, or affects a security control, you MUST update this file.

Structure of a component-definition:

```yaml
# apps/agent-runtime/component-definition.yaml
component-definition:
  uuid: "a1b2c3d4-..."  # Stable UUID, never change
  metadata:
    title: "Agent Runtime"
    version: "1.4.0"     # Matches app version
    oscal-version: "1.1.2"
  components:
    - uuid: "..."
      type: "software"
      title: "Agent Runtime Service"
      description: "Core agentic AI orchestrator providing LLM inference, tool calling, and MCP integration."
      control-implementations:
        - uuid: "..."
          source: "../../compliance/profiles/dod-il5.json"
          description: "DoD IL5 profile implementation"
          implemented-requirements:
            - uuid: "..."
              control-id: "ac-2"
              description: >
                The Agent Runtime implements account management through
                integration with the enterprise IdP via OIDC. User accounts
                are provisioned/deprovisioned via SCIM. Session tokens expire
                after 15 minutes of inactivity (configurable via
                SESSION_TIMEOUT_MINUTES env var). All account actions are
                logged to the centralized audit system.
              props:
                - name: "implementation-status"
                  value: "implemented"
            - uuid: "..."
              control-id: "ac-3"
              description: >
                Access enforcement is implemented via OPA sidecar. All API
                requests are evaluated against RBAC policies defined in
                policies/opa/admission/. Role assignments are managed in
                the enterprise directory and propagated via JWT claims.
              props:
                - name: "implementation-status"
                  value: "implemented"
```

### Rules for Agents Modifying Component Definitions

1. **Never remove existing implemented-requirements** unless the functionality is being deleted.
2. **Never change UUIDs** of existing components or requirements.
3. **Update the version** in metadata when functionality changes.
4. **Use precise, technical language** in descriptions — assessors will read these. Include: what is implemented, how it works, where the configuration lives, and what evidence supports it.
5. **Set `implementation-status`** accurately: `implemented`, `partial`, `planned`, `alternative`, `not-applicable`.
6. **Reference specific code paths, config files, and env vars** in descriptions. These become audit evidence.
7. **Run `trestle validate`** after any modification.

### Policy-as-Code Integration

The `policies/` directory contains enforceable policies that map directly to OSCAL controls via C2P.

**Kyverno policies** enforce controls at the Kubernetes admission level:

| Policy File | NIST 800-53 Control | What It Enforces |
|------------|-------------------|-----------------|
| `restrict-registries.yaml` | SA-12, CM-7 | Only Iron Bank images allowed |
| `require-non-root.yaml` | AC-6, CM-7 | No containers run as root |
| `require-resource-limits.yaml` | SC-6 | CPU/memory limits mandatory |
| `require-labels.yaml` | CM-8 | All resources labeled for inventory |
| `require-probes.yaml` | SI-6 | Liveness/readiness probes required |
| `disallow-privileged.yaml` | AC-6 | No privileged containers |

**OPA policies** enforce controls in the CI/CD pipeline:

| Policy File | NIST 800-53 Control | What It Enforces |
|------------|-------------------|-----------------|
| `pipeline/require-signed-images.rego` | SA-12, SI-7 | Container signatures validated |
| `pipeline/require-sbom.rego` | CM-8, SA-12 | SBOM must exist for all artifacts |
| `pipeline/stig-pass-threshold.rego` | CM-6 | STIG compliance above threshold |
| `pipeline/no-critical-cves.rego` | SI-2, RA-5 | No critical CVEs in dependencies |

When writing new policies:

1. Create the policy file in the appropriate directory
2. Add the NIST 800-53 control mapping as an annotation in the policy metadata
3. Update `compliance/c2p-config.yaml` to include the new policy-to-control mapping
4. Run `make compliance-check` to verify the mapping is valid

### eMASS Synchronization

The `scripts/compliance/sync-emass.py` script pushes OSCAL artifacts to eMASS via its REST API. This runs in CI on merge to `main` (see `pipeline/.github/workflows/emass-sync.yaml`).

What gets synced:

| OSCAL Artifact | eMASS Destination | Trigger |
|---------------|-------------------|---------|
| system-security-plan/ssp.json | SSP module | On SSP regeneration |
| assessment-results/*.json | Test Results | On security scan completion |
| poam/*.json | POA&M module | On new findings or remediation |
| Component status updates | Controls scorecard | On every merge to main |

**Do NOT run `make emass-sync` locally without explicit permission.** This writes to a live government system.

---

## GitOps Rules

### Flux CD Reconciliation

The `deploy/` directory is the GitOps source of truth. Flux CD watches this directory and reconciles the cluster state to match.

1. **Never `kubectl apply` directly.** All changes go through Git → Flux.
2. **Environment promotion** is done by updating `deploy/overlays/<env>/kustomization.yaml` to reference a new image digest.
3. **Secrets are NOT in Git.** Use Sealed Secrets or SOPS (with age keys managed in Vault). Secret references are in Git; secret values are not.
4. **Drift detection** is automatic. If someone manually changes the cluster, Flux reverts it within the reconciliation interval (default: 5 minutes).
5. **Health checks** are defined in Flux Kustomization resources. Deployments must pass health checks before Flux considers reconciliation successful.

### Kustomize Conventions

- `base/` contains the canonical resource definitions
- `overlays/` contains environment-specific patches (resource limits, replicas, env vars)
- Never put hardcoded image tags in `base/` — use Flux image automation or Kustomize image transformers
- All resources must include labels: `app.kubernetes.io/name`, `app.kubernetes.io/part-of: project-sentinel`, `app.kubernetes.io/managed-by: flux`

---

## IL5 Specific Requirements

Every agent must understand these constraints. Violations are not style issues — they are potential Authority to Operate failures.

### Cryptography

- **TLS 1.3 minimum** for all network communication (TLS 1.2 only with AO approval)
- **AES-256** for all data at rest
- **FIPS 140-3 validated modules** — use FIPS-enabled builds of OpenSSL/BoringSSL
- Set `GOFIPS=1`, `OPENSSL_FIPS=1`, or equivalent for your runtime
- Never implement custom cryptography. Use validated libraries only.

### Container Security

- Base images from **Iron Bank only** (`registry1.dso.mil`)
- If an Iron Bank image is unavailable, document the hardening steps and get AO approval before proceeding
- All containers run as **non-root** (UID 1001+)
- All containers have **read-only root filesystem** where possible
- **No privileged containers**, no `hostNetwork`, no `hostPID`
- Resource limits (CPU, memory) on every container
- Security context: `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`

### Audit Logging

- **Every API call** to the agent-runtime must produce an audit log entry
- Log entries include: timestamp (UTC), user identity, action, resource, outcome, source IP
- Logs are immutable once written (append-only)
- Log storage uses encryption at rest
- Structured JSON logging format (not plaintext)
- Retention: 1 year minimum per DoD requirements

### Network

- All intra-cluster communication encrypted (mTLS via service mesh or Kubernetes network policies)
- Egress restricted to explicit allowlist
- No direct internet access from workloads — all external calls through approved proxies
- Network policies in `deploy/base/` define allowed traffic flows

---

## AI/ML and MCP Specific Security

### LLM Inference

- Model weights stored encrypted at rest, decrypted only in memory during inference
- Inference endpoints require authentication (no anonymous access)
- All prompts and completions logged for audit (with PII redaction pipeline)
- Prompt injection defenses: input validation, output filtering, sandboxed tool execution
- Model provenance tracked in SBOM (include model card as component)

### MCP Gateway Security

- All MCP servers register via the gateway — no direct agent-to-server connections
- MCP tool descriptions treated as **untrusted input** (defense against tool description injection)
- Tool execution is sandboxed (isolated containers or gVisor)
- Tool results are validated before being passed back to the LLM
- MCP server identity verification via mTLS certificates
- Rate limiting on all MCP tool calls
- Complete audit trail: which agent called which tool with what parameters and got what result

---

## Testing Requirements

### Unit Tests

- All new code must have unit tests. Minimum 80% line coverage for new files.
- Tests live alongside source code in `tests/` subdirectory of each app
- Use `pytest` for Python, `vitest` for TypeScript
- Mock external services — tests must run without network access

### Security Tests

- SAST runs on every PR (Semgrep or equivalent)
- SCA (dependency vulnerability scan) runs on every PR (Grype)
- Container scan on every build (Trivy or Grype)
- DAST runs in staging environment (OWASP ZAP)

### Compliance Tests

- OSCAL document validation on every PR (`trestle validate`)
- STIG compliance check on container images (`openscap-scanner`)
- Policy validation (`kyverno test`, `opa test`)
- SBOM generation and CVE cross-reference on every build

### What to Do When Tests Fail

1. Fix the failing test. Do not skip, disable, or mark as expected-failure without explicit permission.
2. If a security scan finds a critical or high CVE: stop feature work, remediate or document in POA&M.
3. If OSCAL validation fails: the component-definition is out of sync with code. Update it.
4. If a STIG check fails: check if the control is applicable. If yes, fix. If not, document the tailoring rationale in the component-definition.

---

## Working on This Codebase: Agent Checklist

Before starting any task:

- [ ] Read the relevant `apps/<service>/component-definition.yaml`
- [ ] Understand which NIST 800-53 controls are affected by the change
- [ ] Check `docs/adr/` for relevant architecture decisions

After completing code changes:

- [ ] Run per-file lint, type check, and tests for every modified file
- [ ] Update `component-definition.yaml` if the change implements, modifies, or affects any security control
- [ ] Update or add tests (unit tests for logic, integration tests for API contracts)
- [ ] Run `trestle validate` on any modified OSCAL documents
- [ ] If adding a new dependency: verify it has no critical CVEs, add to SBOM, document in component-definition
- [ ] Write a conventional commit message with OSCAL-CONTROL footer if applicable
- [ ] Verify the change would not break trunk (run the relevant subset of CI checks locally)

---

## Glossary

| Term | Definition |
|------|-----------|
| ATO | Authority to Operate — formal approval to run a system |
| cATO | Continuous ATO — ongoing authorization via automated evidence |
| ConMon | Continuous Monitoring |
| CSRMC | Cybersecurity Risk Management Construct (RMF successor, announced Sept 2025) |
| CUI | Controlled Unclassified Information |
| eMASS | Enterprise Mission Assurance Support Service (DoD GRC platform) |
| IL5 | Impact Level 5 — DoD cloud security tier for NSS/CUI |
| Iron Bank | DoD repository of hardened container images |
| MCP | Model Context Protocol — open standard for AI agent-to-tool connectivity |
| NSS | National Security Systems |
| OSCAL | Open Security Controls Assessment Language (NIST standard) |
| Platform One | DoD enterprise DevSecOps platform |
| POA&M | Plan of Action and Milestones |
| RMF | Risk Management Framework (NIST SP 800-37) |
| SBOM | Software Bill of Materials |
| SCSS | Sidecar Container Security Stack |
| SSP | System Security Plan |
| STIG | Security Technical Implementation Guide |
| Trestle | OSCAL Compass CLI/SDK for compliance-as-code (CNCF sandbox) |
| C2P | Compliance-to-Policy — bridges OSCAL to policy engines |

---

## Reference Links

- [MinimumCD](https://minimumcd.org) — Minimum Viable Continuous Delivery practices
- [OSCAL](https://pages.nist.gov/OSCAL/) — NIST Open Security Controls Assessment Language
- [OSCAL Compass](https://oscal-compass.dev/) — CNCF compliance-as-code tooling
- [Compliance Trestle](https://github.com/oscal-compass/compliance-trestle) — OSCAL CLI/SDK
- [Compliance-to-Policy](https://github.com/oscal-compass/compliance-to-policy) — OSCAL → Policy engine bridge
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP specification
- [DoD DevSecOps Reference Design](https://dodcio.defense.gov/Portals/0/Documents/Library/DevSecOpsReferenceDesign.pdf)
- [DoD Cloud Security Playbook](https://dodcio.defense.gov/Portals/0/Documents/Library/CloudSecurityPlaybookVol1.pdf)
- [NIST SP 800-53 Rev 5](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [NIST SP 800-37 (RMF)](https://csrc.nist.gov/publications/detail/sp/800-37/rev-2/final)
- [CNSSI 1253](https://www.cnss.gov/CNSS/issuances/Instructions.cfm) — NSS security categorization
- [Flux CD](https://fluxcd.io/) — GitOps toolkit for Kubernetes
- [Iron Bank](https://ironbank.dso.mil/) — DoD hardened container registry
- [Platform One Big Bang](https://github.com/DoD-Platform-One/bigbang) — DoD DevSecOps platform

---

*This file is the source of truth for agent behavior. When in doubt, compliance and security take priority over speed and features. Every commit is an audit artifact. Build like an assessor is watching — because the pipeline is.*
