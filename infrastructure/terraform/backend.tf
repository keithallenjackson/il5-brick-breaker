terraform {
  required_version = ">= 1.9.0"

  backend "s3" {
    bucket         = "brick-breaker-tfstate"
    key            = "terraform.tfstate"
    region         = "us-gov-west-1"
    encrypt        = true
    dynamodb_table = "brick-breaker-tfstate-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-gov-west-1"

  default_tags {
    tags = {
      Project     = "brick-breaker"
      Environment = var.environment
      ManagedBy   = "terraform"
      Compliance  = "IL5"
    }
  }
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
}
