# Deployment Runbook

## Overview

All deployments happen via GitOps (Flux CD). No manual `kubectl apply` commands.

## Standard Deployment Flow

1. Merge PR to `main` branch
2. CI/CD pipeline builds, scans, signs, and pushes container images
3. Pipeline updates image digests in `deploy/overlays/<env>/`
4. Flux CD detects the change and reconciles the cluster

## Environment Promotion

### Dev
Automatically deployed on merge to `main`.

### Staging
Update `deploy/overlays/staging/kustomization.yaml` with new image digest.

### Production
Update `deploy/overlays/production/kustomization.yaml` with new image digest.
Requires review and approval before merge.

## Monitoring Deployment

```bash
# Check Flux reconciliation status
flux get kustomizations -n flux-system

# Check deployment rollout
kubectl rollout status deployment/agent-runtime -n brick-breaker
kubectl rollout status deployment/web-ui -n brick-breaker

# Check pod health
kubectl get pods -n brick-breaker
```

## Troubleshooting

### Flux Not Reconciling
```bash
flux reconcile kustomization brick-breaker-dev -n flux-system
```

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n brick-breaker
kubectl logs <pod-name> -n brick-breaker
```

### Database Migration
Database migrations run automatically on backend startup via Alembic.
To run manually:
```bash
kubectl exec -it deploy/agent-runtime -n brick-breaker -- alembic upgrade head
```
