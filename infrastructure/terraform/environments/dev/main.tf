module "vpc" {
  source = "../../modules/vpc"

  name               = "brick-breaker-dev"
  cidr               = "10.0.0.0/16"
  availability_zones = ["us-gov-west-1a", "us-gov-west-1b"]
  environment        = "dev"
}

module "eks" {
  source = "../../modules/eks"

  cluster_name        = "brick-breaker-dev"
  cluster_version     = "1.30"
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  node_instance_types = ["m5.large"]
  node_desired_count  = 2
  environment         = "dev"
}
