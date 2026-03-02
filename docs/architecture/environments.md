# Environment Reference

The application runs in a single AKS cluster with namespace-level isolation.

## Environments

| Property | Dev | Production |
|----------|-----|------------|
| Namespace | `brick-breaker-dev` | `brick-breaker-prod` |
| Hostname | `dev.brickbreak.keithjackson.dev` | `brickbreak.keithjackson.dev` |
| TLS Issuer | `letsencrypt-staging` | `letsencrypt-prod` |
| Deploy Trigger | Automatic on merge to main | Manual approval via GitHub Environment |
| Replicas (API) | 1 | 3 |
| Replicas (UI) | 1 | 2 |
| PostgreSQL Storage | 5Gi | 20Gi |
| Flux Kustomization | `brick-breaker-dev` | `brick-breaker-production` |

## Infrastructure Layer

Cluster-wide infrastructure is managed by two Flux Kustomizations:

### `brick-breaker-infrastructure`

Deploys cluster-wide services:

- **ingress-nginx**: Ingress controller with Azure Load Balancer
- **cert-manager**: TLS certificate management with Let's Encrypt
- **Kyverno**: Kubernetes admission policy engine

### `brick-breaker-post-install`

Deploys resources that depend on CRDs installed by the infrastructure layer:

- **ClusterIssuers**: Let's Encrypt staging and production issuers (requires cert-manager CRDs)
- **Kyverno ClusterPolicies**: 6 admission policies enforcing container security, resource limits, registry restrictions, labeling, health probes, and non-root execution (requires Kyverno CRDs). See `policies/kyverno/` for policy definitions.

Both environment Kustomizations depend on `brick-breaker-post-install`, which in turn depends on `brick-breaker-infrastructure`. Flux will not deploy application workloads until all infrastructure and policies are healthy.

## Namespace Isolation

- Each environment has its own namespace with a `default-deny-all` NetworkPolicy
- Per-service NetworkPolicies allow only the required traffic flows
- Base K8s manifests contain no hardcoded namespace — the overlay's `namespace:` field sets it
- The CD pipeline updates image tags per-overlay, allowing independent rollouts

## Removed Environments

- **Staging** was removed per MinimumCD principles. The same immutable artifact is deployed to dev (automatically) and production (with approval). Two environments are sufficient.
