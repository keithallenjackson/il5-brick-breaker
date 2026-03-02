# Rollback Runbook

## Overview

Rollback is performed by reverting the Git commit that updated image digests in `deploy/overlays/<env>/`. Flux CD automatically reconciles to the previous state.

## Procedure

1. Identify the commit that introduced the problem
2. Revert the deployment commit:
   ```bash
   git revert <commit-hash>
   ```
3. Push the revert commit to `main`
4. Flux CD reconciles within 5 minutes (or force reconcile)

## Force Reconciliation

```bash
flux reconcile kustomization brick-breaker-<env> -n flux-system --with-source
```

## Verify Rollback

```bash
# Check deployment images (dev)
kubectl get deployment -n brick-breaker-dev -o jsonpath='{.items[*].spec.template.spec.containers[*].image}'

# Check deployment images (production)
kubectl get deployment -n brick-breaker-prod -o jsonpath='{.items[*].spec.template.spec.containers[*].image}'

# Check pod status
kubectl get pods -n brick-breaker-dev
kubectl get pods -n brick-breaker-prod

# Check application health
curl -f https://dev.brickbreak.keithjackson.dev/api/healthz
curl -f https://brickbreak.keithjackson.dev/api/healthz
```

## Database Considerations

If the rollback involves database schema changes, ensure backward compatibility. Alembic migrations should be reversible:

```bash
kubectl exec -it deploy/agent-runtime -n brick-breaker-dev -- alembic downgrade -1
```
