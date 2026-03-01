# Database Backup and Restore Runbook

## Overview

PostgreSQL database containing the brick breaker leaderboard scores. Data loss is non-critical but inconvenient.

## Backup Procedure

### Automated (RDS)
If using AWS RDS, automated backups are configured with 30-day retention.

### Manual (In-Cluster StatefulSet)

```bash
# Create a backup
kubectl exec -it postgresql-0 -n brick-breaker -- \
  pg_dump -U $POSTGRES_USER -d brickbreaker -F c -f /tmp/backup.dump

# Copy backup from pod
kubectl cp brick-breaker/postgresql-0:/tmp/backup.dump ./backup-$(date +%Y%m%d).dump
```

## Restore Procedure

```bash
# Copy backup to pod
kubectl cp ./backup.dump brick-breaker/postgresql-0:/tmp/backup.dump

# Restore
kubectl exec -it postgresql-0 -n brick-breaker -- \
  pg_restore -U $POSTGRES_USER -d brickbreaker -c /tmp/backup.dump
```

## Verify Restore

```bash
# Check table exists and has data
kubectl exec -it postgresql-0 -n brick-breaker -- \
  psql -U $POSTGRES_USER -d brickbreaker -c "SELECT count(*) FROM scores;"
```

## PVC Backup

The PostgreSQL data is stored on an encrypted PVC (`gp3-encrypted`). For disaster recovery, consider:

1. EBS snapshots (if on AWS)
2. Velero for Kubernetes-native backup
3. Regular pg_dump to S3 via CronJob
