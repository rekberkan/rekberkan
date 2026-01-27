# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery (DR) procedures for the Kahade P2P Escrow Platform. As a financial platform handling escrow transactions, maintaining data integrity and service availability is critical.

## Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RTO** (Recovery Time Objective) | 4 hours | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | 1 hour | Maximum acceptable data loss |
| **MTTR** (Mean Time to Recovery) | 2 hours | Average time to restore service |

## Disaster Scenarios

### Scenario 1: Database Failure

**Symptoms:**
- Application errors related to database connectivity
- Slow or failed queries
- Data corruption alerts

**Recovery Steps:**

1. **Assess the situation**
   ```bash
   # Check database status
   pg_isready -h $DB_HOST -p 5432
   
   # Check replication lag (if using replicas)
   psql -c "SELECT pg_last_wal_receive_lsn() - pg_last_wal_replay_lsn() AS lag_bytes;"
   ```

2. **Failover to replica (if available)**
   ```bash
   # Promote replica to primary
   pg_ctl promote -D /var/lib/postgresql/data
   
   # Update connection strings
   # Update DNS or load balancer
   ```

3. **Restore from backup (if no replica)**
   ```bash
   # List available backups
   aws s3 ls s3://kahade-backups/postgres/
   
   # Restore latest backup
   pg_restore -h $NEW_DB_HOST -U kahade -d kahade_production backup.dump
   ```

4. **Verify data integrity**
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM orders;
   SELECT SUM(balance_minor) FROM wallets;
   
   -- Verify ledger balance
   SELECT SUM(amount_minor) FROM ledger_entries;
   ```

### Scenario 2: Application Server Failure

**Symptoms:**
- Health check failures
- 502/503 errors from load balancer
- Container crashes

**Recovery Steps:**

1. **Check container status**
   ```bash
   docker ps -a | grep kahade
   kubectl get pods -n production
   ```

2. **Restart containers**
   ```bash
   docker-compose restart app
   kubectl rollout restart deployment/kahade-backend
   ```

3. **Scale up if needed**
   ```bash
   kubectl scale deployment/kahade-backend --replicas=5
   ```

4. **Check logs for root cause**
   ```bash
   docker logs kahade-backend --tail 1000
   kubectl logs -l app=kahade-backend --tail=1000
   ```

### Scenario 3: Redis/Cache Failure

**Symptoms:**
- Session errors
- Rate limiting not working
- Slow response times

**Recovery Steps:**

1. **Check Redis status**
   ```bash
   redis-cli -h $REDIS_HOST ping
   redis-cli -h $REDIS_HOST info replication
   ```

2. **Failover to replica**
   ```bash
   redis-cli -h $REDIS_HOST SLAVEOF NO ONE
   ```

3. **Clear and rebuild cache**
   ```bash
   # Application will rebuild cache on demand
   # Sessions will require re-login
   ```

### Scenario 4: Complete Infrastructure Failure

**Symptoms:**
- All services unreachable
- Cloud provider outage
- Data center failure

**Recovery Steps:**

1. **Activate DR site**
   - Switch DNS to DR region
   - Verify DR database is current
   - Start application in DR region

2. **Communication**
   - Notify stakeholders
   - Update status page
   - Prepare customer communication

3. **Verify DR environment**
   ```bash
   # Run smoke tests
   curl -f https://dr.api.kahade.com/health
   
   # Verify database connectivity
   psql $DR_DATABASE_URL -c "SELECT 1"
   ```

## Backup Strategy

### Database Backups

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Full backup | Daily | 30 days | S3 (cross-region) |
| Incremental | Hourly | 7 days | S3 |
| WAL archiving | Continuous | 7 days | S3 |
| Snapshot | Weekly | 90 days | S3 Glacier |

### Backup Verification

```bash
# Weekly backup verification script
#!/bin/bash

# Download latest backup
aws s3 cp s3://kahade-backups/postgres/latest.dump /tmp/

# Restore to test database
pg_restore -h test-db -U kahade -d kahade_test /tmp/latest.dump

# Run integrity checks
psql -h test-db -d kahade_test -c "
  SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM orders) as orders,
    (SELECT SUM(balance_minor) FROM wallets) as total_balance
"

# Cleanup
dropdb -h test-db kahade_test
```

## DR Testing Schedule

| Test Type | Frequency | Duration | Participants |
|-----------|-----------|----------|--------------|
| Tabletop exercise | Quarterly | 2 hours | All engineering |
| Backup restore | Monthly | 4 hours | DBA + DevOps |
| Failover drill | Bi-annually | 8 hours | Full team |
| Full DR activation | Annually | 1 day | Full team + stakeholders |

## Communication Plan

### Internal Escalation

```
Level 1 (0-15 min): On-call engineer
Level 2 (15-30 min): Tech lead + Engineering manager
Level 3 (30-60 min): CTO + VP Engineering
Level 4 (60+ min): CEO + Executive team
```

### External Communication

1. **Status page update** - Immediate
2. **Customer email** - Within 30 minutes
3. **Social media** - As needed
4. **Press release** - For major incidents only

## Recovery Checklist

### Pre-Recovery
- [ ] Incident declared and documented
- [ ] Team assembled
- [ ] Communication initiated
- [ ] Backup availability confirmed

### During Recovery
- [ ] Root cause identified (if possible)
- [ ] Recovery procedure selected
- [ ] Recovery in progress
- [ ] Regular status updates

### Post-Recovery
- [ ] Service restored and verified
- [ ] Data integrity confirmed
- [ ] Performance baseline achieved
- [ ] Monitoring alerts cleared
- [ ] Stakeholders notified
- [ ] Incident report drafted
- [ ] Post-mortem scheduled

## Contact Information

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Primary On-call | Rotation | PagerDuty | oncall@kahade.com |
| DBA | TBD | TBD | dba@kahade.com |
| DevOps Lead | TBD | TBD | devops@kahade.com |
| CTO | TBD | TBD | cto@kahade.com |

## Related Documents

- [Rollback Strategy](./ROLLBACK_STRATEGY.md)
- [Incident Response](./INCIDENT_RESPONSE.md)
- [Runbook](../RUNBOOK.md)
