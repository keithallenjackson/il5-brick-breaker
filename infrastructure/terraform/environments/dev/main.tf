# Dev environment — AKS cluster in Central US
# OSCAL-CONTROL: CM-2 (Baseline Configuration)
terraform {
  required_version = ">= 1.9.0"

  backend "azurerm" {
    resource_group_name  = "rg-brick-breaker-centralus"
    storage_account_name = "stbrickbreakerstate"
    container_name       = "tfstate"
    key                  = "dev/terraform.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_resource_group" "main" {
  name = "rg-brick-breaker-centralus"
}

module "vnet" {
  source = "../../modules/vnet"

  name                = "brick-breaker-dev"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  environment         = "dev"
}

module "aks" {
  source = "../../modules/aks"

  cluster_name        = "brick-breaker-dev"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  subnet_id           = module.vnet.aks_subnet_id
  vm_size             = "Standard_B2s"
  node_count_min      = 1
  node_count_max      = 2
  environment         = "dev"
}

output "cluster_name" {
  value = module.aks.cluster_name
}

output "kube_config" {
  value     = module.aks.kube_config
  sensitive = true
}
