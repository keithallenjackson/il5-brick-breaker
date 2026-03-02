# ADR 0005: Azure AKS Migration

## Status

Accepted

## Context

The project was originally scaffolded with AWS GovCloud infrastructure (VPC, EKS, RDS via Terraform). However:

- No AWS account is available for this project
- An Azure account is available
- The project is a public-internet demo of what an IL5 system would look like, not an actual IL5 deployment
- Cost minimization is a priority since this is a personal project

## Decision

Migrate all infrastructure from AWS to Azure:

- **Azure AKS** (Free tier, no SLA) replaces AWS EKS
- **Azure VNet** with a single subnet replaces AWS VPC
- **In-cluster PostgreSQL StatefulSet** replaces AWS RDS (managed database unnecessary for a game leaderboard)
- **Azure Storage Account** replaces S3 for Terraform state backend
- **Standard_B2s** VM size (2 vCPU / 4 GiB) with autoscaling 1-2 nodes
- **Azure CNI** with Calico network policy (required for Kubernetes NetworkPolicy support)
- **Region**: Central US

## Consequences

- Estimated cost: ~$54/month (1 node) to ~$84/month (2 nodes autoscaled)
- Free tier AKS has no SLA — acceptable for a demo project
- Single cluster with namespace isolation (brick-breaker-dev, brick-breaker-prod) instead of separate clusters per environment
- Bootstrap requires a one-time local Terraform run to create the resource group, storage account, and service principal
- The Terraform modules (VPC/EKS/RDS) were deleted and replaced with VNet/AKS modules
- The staging environment was removed (MinimumCD: two environments — dev and production — are sufficient)
