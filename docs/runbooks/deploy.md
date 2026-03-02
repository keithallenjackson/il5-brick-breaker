# Deployment Runbook

## Overview

All deployments happen via GitOps (Flux CD). No manual `kubectl apply` commands.

## Standard Deployment Flow

1. Merge PR to `main` branch
2. Build and Publish workflow builds, scans (Trivy), signs (Cosign), and pushes container images to GHCR
3. Deploy workflow auto-updates image tags in `deploy/overlays/dev/kustomization.yaml` and commits to main
4. Flux CD detects the change and reconciles the dev environment
5. After dev is verified, the Deploy workflow waits for manual approval to promote to production

## Environments

| Environment | Namespace | Hostname | Deploy Trigger |
|-------------|-----------|----------|----------------|
| Dev | `brick-breaker-dev` | `dev.brickbreak.keithjackson.dev` | Automatic on merge to main |
| Production | `brick-breaker-prod` | `brickbreak.keithjackson.dev` | Manual approval via GitHub Environment |

## Monitoring Deployment

```bash
# Check Flux reconciliation status
flux get kustomizations -n flux-system

# Check deployment rollout (dev)
kubectl rollout status deployment/agent-runtime -n brick-breaker-dev
kubectl rollout status deployment/web-ui -n brick-breaker-dev

# Check deployment rollout (production)
kubectl rollout status deployment/agent-runtime -n brick-breaker-prod
kubectl rollout status deployment/web-ui -n brick-breaker-prod

# Check pod health
kubectl get pods -n brick-breaker-dev
kubectl get pods -n brick-breaker-prod
```

## Troubleshooting

### Flux Not Reconciling
```bash
flux reconcile kustomization brick-breaker-dev -n flux-system
flux reconcile kustomization brick-breaker-production -n flux-system
```

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n brick-breaker-dev
kubectl logs <pod-name> -n brick-breaker-dev
```

### Database Migration
Database migrations run automatically via an init container (`db-migrate`) before the agent-runtime starts. The init container runs `alembic upgrade head` using the `DATABASE_URL` from the `database-credentials` secret.

To run manually:
```bash
kubectl exec -it deploy/agent-runtime -n brick-breaker-dev -- python -m alembic upgrade head
```
