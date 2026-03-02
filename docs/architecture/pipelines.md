# CI/CD Pipeline Reference

All pipelines are defined in `.github/workflows/`. The project follows MinimumCD principles: trunk-based development, single pipeline deploys to all environments, immutable artifacts.

## Workflows

### 1. CI (`ci.yaml`)

**Trigger**: Pull request to `main`

Runs lint, type checking, unit tests, and OSCAL validation.

- Python: ruff lint/format, mypy, pytest (80% coverage minimum)
- TypeScript: eslint, tsc, vitest
- OSCAL: validate component-definitions and profiles
- Kyverno: validate policy syntax

### 2. Build and Publish (`build-publish.yaml`)

**Trigger**: Push to `main`

Builds both container images in parallel:

1. Build with Docker Buildx
2. Push to GHCR (`ghcr.io/keithallenjackson/il5-brick-breaker/<app>`)
3. Scan with Trivy (CRITICAL/HIGH CVEs block the pipeline)
4. Sign with Cosign (keyless, OIDC-based)
5. Generate SBOM with Syft (CycloneDX format)

Tags: `:<commit-sha>` and `:latest`

### 3. Security Scan (`security-scan.yaml`)

**Trigger**: Pull request to `main`

- SAST: Semgrep with auto config
- SCA: Grype (Python), npm audit (TypeScript)
- Secret scanning

### 4. Compliance Check (`compliance-check.yaml`)

**Trigger**: Pull request to `main`

- Compliance-to-Policy (C2P) mapping validation (verifies `compliance/c2p-config.yaml` policy files exist)
- OSCAL document validation (validates `apps/*/component-definition.yaml`)
- SSP generation from component definitions (uploads as artifact)
- Kyverno policy validation

### 5. Deploy (`deploy.yaml`)

**Trigger**: `workflow_run` after Build and Publish succeeds on main

Two jobs:

1. **deploy-dev** (automatic): Updates image tags in `deploy/overlays/dev/kustomization.yaml`, commits to main. Flux picks up the change.
2. **deploy-production** (manual approval): Requires approval via GitHub Environment protection rules. Updates image tags in `deploy/overlays/production/kustomization.yaml`.

### 6. Terraform (`terraform.yaml`)

**Trigger**: Push/PR with changes in `infrastructure/terraform/**` (excludes `bootstrap/`)

- **On PR**: `terraform plan` with output posted as PR comment
- **On merge to main**: `terraform apply -auto-approve` (requires `terraform` GitHub Environment approval)

## Pipeline Flow

```
PR opened
  → CI (lint, test, validate)
  → Security Scan (Semgrep, Grype)
  → Compliance Check (OSCAL, Kyverno)

PR merged to main
  → Build and Publish (build, Trivy scan, Cosign sign, SBOM)
  → Deploy to dev (automatic)
  → Deploy to production (manual approval)
```

## Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `ARM_CLIENT_ID` | Azure service principal for Terraform |
| `ARM_CLIENT_SECRET` | Azure service principal secret |
| `ARM_TENANT_ID` | Azure tenant |
| `ARM_SUBSCRIPTION_ID` | Azure subscription |

## Required GitHub Environments

| Environment | Protection |
|-------------|-----------|
| `dev` | None |
| `production` | Required reviewers |
| `terraform` | Required reviewers |
