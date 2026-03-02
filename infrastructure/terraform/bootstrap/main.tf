# Bootstrap Terraform — creates Azure prerequisites for the main Terraform config.
# Uses local backend since the remote state storage doesn't exist yet.
#
# Usage:
#   az login
#   cd infrastructure/terraform/bootstrap
#   terraform init
#   terraform apply
#
# After apply, set the outputs as GitHub repository secrets.

terraform {
  required_version = ">= 1.9.0"

  backend "local" {}

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "azuread" {}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "centralus"
}

variable "project" {
  description = "Project name used in resource naming"
  type        = string
  default     = "brick-breaker"
}

# --- Data Sources ---

data "azurerm_subscription" "current" {}
data "azuread_client_config" "current" {}

# --- Resource Group ---

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project}-${var.location}"
  location = var.location

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# --- Terraform State Storage ---

resource "azurerm_storage_account" "tfstate" {
  name                     = "stbrickbreakerstate"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Purpose   = "terraform-state"
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                 = "tfstate"
  storage_account_id   = azurerm_storage_account.tfstate.id
}

# --- Service Principal for GitHub Actions ---

resource "azuread_application" "github" {
  display_name = "sp-${var.project}-github"
  owners       = [data.azuread_client_config.current.object_id]
}

resource "azuread_service_principal" "github" {
  client_id = azuread_application.github.client_id
  owners    = [data.azuread_client_config.current.object_id]
}

resource "azuread_service_principal_password" "github" {
  service_principal_id = azuread_service_principal.github.id
  display_name         = "github-actions"
  end_date_relative    = "8760h" # 1 year
}

# Grant Contributor on the resource group
resource "azurerm_role_assignment" "github_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github.object_id
}

# --- Outputs ---

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "storage_account_name" {
  value = azurerm_storage_account.tfstate.name
}

output "arm_client_id" {
  description = "Set as GitHub secret: ARM_CLIENT_ID"
  value       = azuread_application.github.client_id
}

output "arm_client_secret" {
  description = "Set as GitHub secret: ARM_CLIENT_SECRET"
  value       = azuread_service_principal_password.github.value
  sensitive   = true
}

output "arm_tenant_id" {
  description = "Set as GitHub secret: ARM_TENANT_ID"
  value       = data.azuread_client_config.current.tenant_id
}

output "arm_subscription_id" {
  description = "Set as GitHub secret: ARM_SUBSCRIPTION_ID"
  value       = data.azurerm_subscription.current.subscription_id
}

output "instructions" {
  value = <<-EOT
    Bootstrap complete. Set these GitHub repository secrets:

      ARM_CLIENT_ID       = <arm_client_id output>
      ARM_CLIENT_SECRET   = <arm_client_secret output — run: terraform output -raw arm_client_secret>
      ARM_TENANT_ID       = <arm_tenant_id output>
      ARM_SUBSCRIPTION_ID = <arm_subscription_id output>

    Then the main Terraform and GitHub Actions workflows can authenticate to Azure.
  EOT
}
