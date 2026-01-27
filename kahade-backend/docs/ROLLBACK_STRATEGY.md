# Rollback Strategy

## Overview

This document outlines the rollback procedures for the Kahade P2P Escrow Platform. A well-defined rollback strategy is critical for maintaining service availability and data integrity during deployment failures.

## Pre-Deployment Checklist

Before any deployment, ensure:

1. **Database backup** is completed and verified
2. **Current version tag** is documented
3. **Rollback scripts** are tested in staging
4. **Team is notified** of deployment window
5. **Monitoring dashboards** are open and accessible

## Rollback Procedures

### 1. Application Rollback

#### Docker/Container Rollback

```bash
# List available image versions
docker images kahade-backend --format "{{.Tag}}"

# Rollback to previous version
docker-compose down
docker tag kahade-backend:previous kahade-backend:latest
docker-compose up -d

# Or specify exact version
docker-compose pull kahade-backend:v1.2.3
docker-compose up -d --force-recreate
```

#### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/kahade-backend

# Rollback to previous version
kubectl rollout undo deployment/kahade-backend

# Rollback to specific revision
kubectl rollout undo deployment/kahade-backend --to-revision=2

# Verify rollback status
kubectl rollout status deployment/kahade-backend
```

### 2. Database Rollback

#### Prisma Migration Rollback

```bash
# View migration history
npx prisma migrate status

# Rollback last migration (development only)
npx prisma migrate reset

# For production, use manual SQL rollback
# Each migration should have a corresponding down.sql file
```

#### Manual Database Rollback

```bash
# Connect to database
psql $DATABASE_URL

# Run rollback SQL
\i /path/to/rollback/migration_YYYYMMDD_down.sql

# Verify rollback
\dt  # List tables
\d table_name  # Describe table structure
```

#### Point-in-Time Recovery (PITR)

For critical failures, use database PITR:

```bash
# AWS RDS
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier kahade-prod \
  --target-db-instance-identifier kahade-prod-restored \
  --restore-time "2024-01-15T10:30:00Z"

# After verification, swap DNS or connection strings
```

### 3. Configuration Rollback

```bash
# Restore previous environment configuration
cp .env.production.backup .env.production

# Or use secrets manager versioning
aws secretsmanager get-secret-value \
  --secret-id kahade/production \
  --version-stage AWSPREVIOUS
```

## Rollback Decision Matrix

| Scenario | Action | Time Limit | Escalation |
|----------|--------|------------|------------|
| API errors > 5% | Immediate rollback | 5 minutes | On-call engineer |
| Database migration failure | Stop deployment, assess | 15 minutes | Tech lead |
| Performance degradation > 50% | Rollback if not resolved | 10 minutes | On-call engineer |
| Security vulnerability discovered | Immediate rollback | Immediate | Security team |
| Data corruption detected | Stop all traffic, investigate | Immediate | CTO + DBA |

## Rollback Verification

After rollback, verify:

1. **Health checks passing**
   ```bash
   curl -f https://api.kahade.com/health
   ```

2. **Error rates normalized**
   - Check Sentry/error tracking
   - Check application logs

3. **Database integrity**
   ```sql
   -- Check for orphaned records
   SELECT COUNT(*) FROM orders WHERE user_id NOT IN (SELECT id FROM users);
   
   -- Verify ledger balance
   SELECT SUM(amount_minor) FROM ledger_entries WHERE account_id = 'platform';
   ```

4. **Critical flows working**
   - User login
   - Order creation
   - Payment processing
   - Escrow release

## Communication Template

### Internal Notification

```
Subject: [ROLLBACK] Kahade Backend - v{version}

Status: Rollback initiated
Time: {timestamp}
Reason: {brief description}
Impact: {affected services/users}
ETA for resolution: {estimate}

Actions taken:
1. Rolled back to version {previous_version}
2. {additional actions}

Next steps:
1. Root cause analysis
2. Fix development
3. Re-deployment planning
```

### External Communication (if needed)

```
We are currently experiencing technical difficulties with our platform. 
Our team is actively working to resolve the issue. 
We apologize for any inconvenience and will provide updates as available.
```

## Post-Rollback Actions

1. **Document the incident**
   - Timeline of events
   - Root cause analysis
   - Actions taken

2. **Create follow-up tasks**
   - Fix the underlying issue
   - Improve testing/deployment process
   - Update runbooks if needed

3. **Schedule post-mortem**
   - Within 48 hours of incident
   - Include all stakeholders

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-call Engineer | PagerDuty | 24/7 |
| Tech Lead | {contact} | Business hours |
| DBA | {contact} | On-call |
| Security | {contact} | On-call |

## Related Documents

- [Deployment Guide](./DEPLOYMENT.md)
- [Disaster Recovery Plan](./DISASTER_RECOVERY.md)
- [Incident Response](./INCIDENT_RESPONSE.md)
