# ADR 0006: Chainguard Base Images

## Status

Accepted

## Context

The project originally specified Iron Bank (`registry1.dso.mil`) as the only approved container registry. However:

- Iron Bank requires CAC (Common Access Card) authentication, which is not available for this public-internet project
- The initial `nginx:1.27-alpine` base image had 18 HIGH/CRITICAL CVEs (libcrypto3, libssl3, libpng, libxml2)
- Trivy container scanning was blocking the CI/CD pipeline due to these CVEs
- An alternative zero-CVE base image was needed

## Decision

Migrate to Chainguard distroless images (`cgr.dev/chainguard/*`):

- **web-ui**: `cgr.dev/chainguard/nginx:latest` (runtime) with `node:22-slim` (build stage)
- **agent-runtime**: `cgr.dev/chainguard/python:latest` (runtime) with `cgr.dev/chainguard/python:latest-dev` (build stage with pip)

The Kyverno `restrict-registries.yaml` policy was updated to allow `cgr.dev/*` alongside `ghcr.io/*` and `docker.io/*`.

## Consequences

- **Zero CVEs** in runtime images — Trivy scans pass cleanly
- **UID change**: Chainguard images run as UID 65532 (`nonroot`) instead of the previously specified UID 1001. All K8s security contexts were updated.
- **Distroless**: No shell, no package manager in runtime images. Debug containers must be used for troubleshooting.
- **Filesystem layout differences**: Chainguard nginx uses `/var/lib/nginx/tmp` instead of `/var/cache/nginx`. Volume mounts were updated.
- **Free `:latest` tag**: Chainguard provides free public access to `:latest` tags. Pinned version tags require a paid subscription.
- **Build stage pattern**: The `-dev` variant includes pip/build tools. Dependencies are installed there, then only runtime artifacts are copied to the distroless image.
- For actual IL5 deployment, these would need to be replaced with Iron Bank equivalents once CAC access is available.
