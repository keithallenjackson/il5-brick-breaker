# OSCAL-CONTROL: SC-28 (Protection of Information at Rest), SC-8 (Transmission Confidentiality)

variable "identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "brickbreaker"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security group IDs allowed to connect"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.identifier}-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.identifier}-rds-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  tags = {
    Name = "${var.identifier}-rds-sg"
  }
}

resource "aws_kms_key" "rds" {
  description             = "RDS encryption key for ${var.identifier}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${var.identifier}-rds-key"
  }
}

resource "aws_db_instance" "main" {
  identifier = var.identifier

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2

  db_name  = var.database_name
  username = "brickbreaker_admin"

  manage_master_user_password = true

  # Encryption at rest with AES-256 (SC-28)
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # High availability
  multi_az = var.environment == "production" ? true : false

  # Backup and maintenance
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Deletion protection for production
  deletion_protection = var.environment == "production" ? true : false

  # Performance insights
  performance_insights_enabled = true

  tags = {
    Name = var.identifier
  }
}

output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "database_name" {
  value = aws_db_instance.main.db_name
}
