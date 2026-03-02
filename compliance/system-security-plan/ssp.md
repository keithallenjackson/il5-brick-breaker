# System Security Plan

**Generated:** 2026-03-02T07:46:04.745267+00:00
**Project Status:** Open-source example project (MIT License) — not government owned, no actual CUI
**System:** Brick Breaker — Example application demonstrating DoD IL5 compliance patterns
**OSCAL Version:** 1.1.2

## System Components

### Brick Breaker API Service Component Definition

**Brick Breaker API Service** (software)

FastAPI-based REST API service for the Brick Breaker game application. Provides score submission, leaderboard retrieval, and health check endpoints with comprehensive audit logging, input validation, and security controls.

### Web UI

**Brick Breaker Web UI** (software)

React 19 + TypeScript single-page application served via nginx. Provides the game interface and communicates with the backend API for score submission and leaderboard retrieval.


---

## Control Implementation Summary

| Control | Status | Implementing Components |
|---------|--------|------------------------|
| AC-4 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| AC-6 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| AU-2 | implemented | Brick Breaker API Service |
| AU-3 | implemented | Brick Breaker API Service |
| AU-8 | implemented | Brick Breaker API Service |
| CA-7 | implemented | Brick Breaker API Service |
| CM-2 | implemented | Brick Breaker API Service |
| CM-3 | implemented | Brick Breaker API Service |
| CM-7 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| CP-10 | implemented | Brick Breaker API Service |
| IA-2 | not-applicable | Brick Breaker API Service |
| IA-5 | not-applicable | Brick Breaker API Service |
| SA-11 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| SA-15 | implemented | Brick Breaker API Service |
| SA-5 | implemented | Brick Breaker API Service |
| SC-13 | implemented | Brick Breaker Web UI |
| SC-28 | implemented | Brick Breaker API Service |
| SC-6 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| SC-7 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| SC-8 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| SI-10 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| SI-11 | implemented | Brick Breaker API Service, Brick Breaker Web UI |
| SI-6 | implemented | Brick Breaker API Service |

**Total controls addressed:** 23

---

## Control Implementation Details

### AC-4

**Component:** Brick Breaker API Service  
**Status:** implemented

Information Flow Enforcement - Network policies enforce strict information flow paths: ingress-nginx → web-ui → agent-runtime → PostgreSQL. No lateral movement is allowed between services. The agent-runtime cannot initiate connections to web-ui or any external service. Data flows are unidirectional from the user through the ingress to the API and into the database.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Information Flow Enforcement - Network policies restrict the web-ui to only communicate with the agent-runtime service. No direct database access is permitted from the web-ui. Data flows are: user → ingress → web-ui → agent-runtime → PostgreSQL.


### AC-6

**Component:** Brick Breaker API Service  
**Status:** implemented

Least Privilege - The container runs as the Chainguard nonroot user (UID 65532) as enforced by the distroless base image. The Kubernetes security context sets allowPrivilegeEscalation: false, readOnlyRootFilesystem: true, and drops ALL capabilities. The database connection uses parameterized queries via SQLAlchemy ORM (src/db/repository.py) to prevent SQL injection. The application operates with minimal database permissions required for CRUD operations on the scores table.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Least privilege is enforced at the container level. The Chainguard nginx base image runs as the nonroot user (UID 65532) by default. The nginx configuration listens on unprivileged port 8080. The Kubernetes security context sets allowPrivilegeEscalation: false, readOnlyRootFilesystem: true, and drops ALL capabilities.


### AU-2

**Component:** Brick Breaker API Service  
**Status:** implemented

Audit Events - The Brick Breaker API Service implements comprehensive audit logging via the AuditMiddleware (src/middleware/audit.py). The middleware captures audit events for all API requests including: HTTP method, resource path, response status code, client IP address, user agent, and request duration. Health check endpoints (/healthz, /readyz) are excluded from audit logging to reduce noise. Audit events are emitted as structured JSON via the structlog library.

### AU-3

**Component:** Brick Breaker API Service  
**Status:** implemented

Content of Audit Records - Each audit log entry produced by AuditMiddleware (src/middleware/audit.py) contains the following fields: timestamp (UTC ISO 8601 format), user_identity (currently "anonymous"), action (HTTP method), resource (URL path), outcome ("success" or "error"), status_code (HTTP response code), source_ip (from X-Forwarded-For header or direct client IP), user_agent (browser/client identifier), request_id (unique UUID4 per request), and duration_ms (request processing time in milliseconds).

### AU-8

**Component:** Brick Breaker API Service  
**Status:** implemented

Time Stamps - The AuditMiddleware (src/middleware/audit.py) generates timestamps using Python's datetime.now(UTC) to ensure all audit records use UTC timezone. Timestamps are formatted in ISO 8601 format for consistent, machine-parseable time representation across all audit log entries. The created_at field in the Score model (src/db/models.py) uses server_default=func.now() for database-level timestamping.

### CA-7

**Component:** Brick Breaker API Service  
**Status:** implemented

Continuous Monitoring - The CI/CD pipeline provides continuous security monitoring: SAST via Semgrep, SCA via Grype, container scanning via Trivy, and secret scanning via detect-secrets run on every PR and merge to main. CRITICAL and HIGH findings block the pipeline. Results are uploaded as GitHub Actions artifacts for audit review.

### CM-2

**Component:** Brick Breaker API Service  
**Status:** implemented

Baseline Configuration - Infrastructure baseline is established via Terraform IaC for Azure resources (infrastructure/terraform/), Kustomize manifests for Kubernetes resources (deploy/base/), and Flux CD for automated drift detection and reconciliation. All baseline configurations are version-controlled in Git.

### CM-3

**Component:** Brick Breaker API Service  
**Status:** implemented

Configuration Change Control - All changes follow Git-based trunk development with required PR reviews and CI validation gates (lint, type check, test, OSCAL validation, security scanning). Flux CD pull-based reconciliation ensures only approved changes reach the cluster. All changes are auditable through Git history.

### CM-7

**Component:** Brick Breaker API Service  
**Status:** implemented

Least Functionality - The API service is built as a minimal multi-stage container image using Chainguard's distroless Python base image (cgr.dev/chainguard/python:latest) with zero known CVEs. Dependencies are installed in the builder stage (python:latest-dev) and only the runtime artifacts are copied to the final image. The container runs as the Chainguard nonroot user (UID 65532), disables Python bytecode generation (PYTHONDONTWRITEBYTECODE=1), and only exposes the required port (8000). The application only includes endpoints necessary for game functionality: score submission, leaderboard retrieval, and health checks. CORS is configured to restrict origins to explicitly allowed domains via the CORS_ORIGINS setting (src/config.py).

**Component:** Brick Breaker Web UI  
**Status:** implemented

Least functionality is enforced through the multi-stage Dockerfile. The production image uses Chainguard distroless nginx base image (cgr.dev/chainguard/nginx:latest) with zero known CVEs, containing only the static built assets and nginx configuration. No build tools, source code, or development dependencies are included in the production container. The container runs as the Chainguard nonroot user (UID 65532).


### CP-10

**Component:** Brick Breaker API Service  
**Status:** implemented

System Recovery and Reconstitution - Flux CD GitOps reconciliation provides self-healing from Git state. Infrastructure can be reproduced from Terraform definitions. Kubernetes deployments can be rolled back by reverting a Git commit in deploy/overlays/<env>/. Terraform state versioning in Azure Storage enables infrastructure state recovery.

### IA-2

**Component:** Brick Breaker API Service  
**Status:** not-applicable

Identification and Authentication - Not applicable. The brick breaker game uses anonymous score submission by design (docs/architecture/adr/0004-anonymous-score-submission.md). No user authentication is required. The game is publicly accessible.

### IA-5

**Component:** Brick Breaker API Service  
**Status:** not-applicable

Authenticator Management - Not applicable. No user authenticators are managed by the application. Service-to-service communication relies on Kubernetes service accounts and network policies for access control within the cluster.

### SA-11

**Component:** Brick Breaker API Service  
**Status:** implemented

Developer Testing and Evaluation - The agent-runtime has a pytest test suite in tests/ with 80% minimum coverage enforced by CI via --cov-fail-under=80. Tests cover schemas (test_schemas.py), API routes (test_routes.py), middleware (test_middleware.py), and database operations (test_db.py). The CI pipeline (.github/workflows/ci.yaml) runs tests on every PR and merge.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Developer Testing and Evaluation - The web-ui has a vitest test suite in tests/ covering UI components, API client, and game logic mocks. The CI pipeline (.github/workflows/ci.yaml) runs tests on every PR and merge to main. Tests must pass before merge is allowed.


### SA-15

**Component:** Brick Breaker API Service  
**Status:** implemented

Development Process, Standards, and Tools - MinimumCD practices are enforced: trunk-based development, automated testing before merge, immutable container artifacts signed with Cosign, and the CI/CD pipeline as the sole deployment path. Development standards are documented in AGENTS.md.

### SA-5

**Component:** Brick Breaker API Service  
**Status:** implemented

System Documentation - System documentation is maintained in docs/architecture/ (ADRs, environments.md, pipelines.md), docs/security.md, AGENTS.md (development standards), and OSCAL component-definitions (apps/*/component-definition.yaml). All documentation is version-controlled alongside source code.

### SC-13

**Component:** Brick Breaker Web UI  
**Status:** implemented

Cryptographic protection is provided through TLS termination at the ingress layer and HSTS enforcement via nginx security headers. The Content-Security-Policy header restricts script execution to same-origin sources with 'unsafe-eval' permitted for pixi.js v8 WebGL shader compilation (new Function). All API communication uses the cluster's mTLS-secured network.


### SC-28

**Component:** Brick Breaker API Service  
**Status:** implemented

Protection of Information at Rest - Database credentials are stored in Kubernetes Secrets (database-credentials). PostgreSQL data resides on persistent volumes provisioned via the managed-csi storage class. Terraform state is stored in an Azure Storage Account with TLS 1.2 minimum and blob versioning enabled.

### SC-6

**Component:** Brick Breaker API Service  
**Status:** implemented

Resource Availability - The application includes health check endpoints for liveness (/healthz) and readiness (/readyz) probes defined in src/routes/health.py. The readiness probe verifies database connectivity by executing a SELECT 1 query, returning HTTP 503 if the database is unavailable. The Dockerfile configures a HEALTHCHECK with 30-second intervals, 3-second timeout, and 3 retries. Query parameters enforce limits (max 100 records per request) to prevent resource exhaustion on the leaderboard endpoint.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Resource availability is supported through nginx gzip compression for static assets, aggressive caching of hashed assets (1 year expiry with immutable flag), and no-cache directives for index.html to ensure clients always receive the latest version. Container resource limits are enforced via Kubernetes manifests in deploy/.


### SC-7

**Component:** Brick Breaker API Service  
**Status:** implemented

Boundary Protection - Default-deny Kubernetes NetworkPolicies in deploy/base/network-policies.yaml enforce network boundaries. The agent-runtime only accepts ingress from the ingress-nginx namespace and web-ui pods on port 8000. Egress is limited to PostgreSQL on port 5432 and DNS on port 53. All other traffic is denied by the default-deny-all NetworkPolicy.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Boundary Protection - Default-deny Kubernetes NetworkPolicies in deploy/base/network-policies.yaml enforce network boundaries. The web-ui accepts ingress only from the ingress-nginx namespace on port 8080. Egress is limited to agent-runtime on port 8000 and DNS on port 53. All other traffic is denied.


### SC-8

**Component:** Brick Breaker API Service  
**Status:** implemented

Transmission Confidentiality and Integrity - The SecurityHeadersMiddleware (src/middleware/security_headers.py) enforces Strict-Transport-Security with max-age=31536000 and includeSubDomains directive, ensuring all communications use HTTPS in production. Additional security headers include X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Content-Security-Policy for API-appropriate restrictions, and Referrer-Policy: strict-origin-when-cross-origin.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Transport confidentiality is enforced via nginx configuration. The nginx.conf includes Strict-Transport-Security header with max-age=31536000 and includeSubDomains directive, ensuring all communications use HTTPS/TLS. The CSP header restricts resource loading to same-origin. API proxy requests to the backend are forwarded over the internal cluster network secured by mTLS via the service mesh.


### SI-10

**Component:** Brick Breaker API Service  
**Status:** implemented

Information Input Validation - All API inputs are validated using Pydantic v2 schemas defined in src/schemas.py. The ScoreSubmission schema enforces: player_name must be 1-50 characters matching pattern ^[a-zA-Z0-9_ -]+$ (preventing injection attacks), score must be between 0 and 999,999,999, and level_reached must be between 1 and 9,999. Query parameters for the leaderboard endpoint are validated with ge/le constraints (limit 1-100, offset >= 0). Invalid inputs receive HTTP 422 responses with detailed validation error messages.

**Component:** Brick Breaker Web UI  
**Status:** implemented

Input validation is implemented on all user-facing form fields. The score submission form validates player_name against a pattern of allowed characters (alphanumeric, spaces, hyphens, underscores) with a maximum length of 50 characters. Client-side validation mirrors server-side validation rules defined in the agent-runtime API. Input validation is performed in src/ui/GameOverScreen.tsx using regex pattern matching before submission to the backend API.


### SI-11

**Component:** Brick Breaker API Service  
**Status:** implemented

Error Handling - FastAPI exception handlers and Pydantic validation provide structured error responses. Invalid input returns HTTP 422 with detailed validation error messages. Unhandled exceptions return HTTP 500 without leaking stack traces or internal implementation details. Errors are captured in audit logs via AuditMiddleware (src/middleware/audit.py) with outcome set to "error".

**Component:** Brick Breaker Web UI  
**Status:** implemented

Error Handling - React error boundaries catch rendering failures and display user-friendly fallback UI. The ApiError class in src/api/client.ts handles failed API responses without exposing internal server details to the user. Network errors and timeouts are caught and presented as generic user-facing messages.


### SI-6

**Component:** Brick Breaker API Service  
**Status:** implemented

Software, Firmware, and Information Integrity - Database migrations are managed through Alembic (alembic/versions/0001_create_scores_table.py), ensuring schema integrity and version-controlled database changes. The application uses Pydantic v2 for strict data validation on both input (ScoreSubmission) and output (ScoreResponse) with from_attributes mode for ORM model validation. SQLAlchemy mapped columns enforce database-level type constraints (String(50), Integer, DateTime with timezone) in src/db/models.py.

---
*Auto-generated from OSCAL component definitions.*