# Azure Deployment Guide

Step-by-step guide to deploy the Brick Breaker application from scratch on Azure AKS.

## Prerequisites

- Azure CLI (`az`) installed and logged in
- Terraform >= 1.9 installed
- kubectl installed
- Flux CLI installed (`flux`)
- GitHub CLI (`gh`) installed

## Step 1: Bootstrap Azure Resources

This creates the resource group, Terraform state storage, and a service principal for GitHub Actions.

```bash
az login
cd infrastructure/terraform/bootstrap
terraform init
terraform apply
```

Note the outputs. You'll need them for the next step.

## Step 2: Set GitHub Repository Secrets

```bash
# Get the sensitive output
terraform output -raw arm_client_secret

# Set all 4 secrets in GitHub
gh secret set ARM_CLIENT_ID --body "<arm_client_id output>"
gh secret set ARM_CLIENT_SECRET --body "<arm_client_secret output>"
gh secret set ARM_TENANT_ID --body "<arm_tenant_id output>"
gh secret set ARM_SUBSCRIPTION_ID --body "<arm_subscription_id output>"
```

## Step 3: Create GitHub Environments

Create these environments in your GitHub repository settings (Settings > Environments):

| Environment | Protection Rules |
|-------------|-----------------|
| `dev` | None (auto-deploy) |
| `production` | Required reviewers |
| `terraform` | Required reviewers |

## Step 4: Provision AKS Cluster

Push a change to `infrastructure/terraform/` on main to trigger the Terraform pipeline, or run manually:

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform apply -var="environment=dev"
```

## Step 5: Configure kubectl

```bash
az aks get-credentials \
  --resource-group rg-brick-breaker-centralus \
  --name brick-breaker-dev
```

## Step 6: Bootstrap Flux CD

```bash
flux bootstrap github \
  --owner=keithallenjackson \
  --repository=agentic-ai-brick-breaker \
  --branch=main \
  --path=deploy/flux-system \
  --personal
```

## Step 7: Create Database Secrets

```bash
# Dev namespace
kubectl create secret generic database-credentials \
  -n brick-breaker-dev \
  --from-literal=username=brickbreaker \
  --from-literal=password="$(openssl rand -base64 24)" \
  --from-literal=url="postgresql+asyncpg://brickbreaker:<password>@postgresql:5432/brickbreaker"

# Production namespace
kubectl create secret generic database-credentials \
  -n brick-breaker-prod \
  --from-literal=username=brickbreaker \
  --from-literal=password="$(openssl rand -base64 24)" \
  --from-literal=url="postgresql+asyncpg://brickbreaker:<password>@postgresql:5432/brickbreaker"
```

## Step 8: Get Load Balancer IP and Set DNS

Wait for ingress-nginx to provision the Azure Load Balancer:

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Set DNS A records:
- `brickbreak.keithjackson.dev` → `<LB IP>`
- `dev.brickbreak.keithjackson.dev` → `<LB IP>` (same IP)

## Step 9: Verify

```bash
# Check Flux reconciliation
flux get kustomizations -n flux-system

# Check pods
kubectl get pods -n brick-breaker-dev
kubectl get pods -n brick-breaker-prod

# Check certificates
kubectl get certificates -n brick-breaker-dev
kubectl get certificates -n brick-breaker-prod

# Smoke test
curl -s https://dev.brickbreak.keithjackson.dev/api/healthz
curl -s https://brickbreak.keithjackson.dev/api/healthz
```
