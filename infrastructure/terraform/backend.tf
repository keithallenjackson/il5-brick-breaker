# OSCAL-CONTROL: CM-2 (Baseline Configuration)
terraform {
  required_version = ">= 1.9.0"

  backend "azurerm" {
    resource_group_name  = "rg-brick-breaker-centralus"
    storage_account_name = "stbrickbreakerstate"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
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

variable "environment" {
  description = "Deployment environment (dev, production)"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralus"
}
