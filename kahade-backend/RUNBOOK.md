# Kahade P2P Escrow Platform - Runbook

## Overview

This runbook provides operational procedures for managing the Kahade P2P Escrow Platform in production.

## Table of Contents

1. [Deployment](#deployment)
2. [Monitoring](#monitoring)
3. [Common Issues](#common-issues)
4. [Database Operations](#database-operations)
5. [Security Incidents](#security-incidents)
6. [Scaling](#scaling)

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing in CI
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Rollback plan prepared
- [ ] Team notified

### Deploy to Production

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Run database migrations
pnpm prisma migrate deploy

# 4. Build application
pnpm build

# 5. Restart application
pm2 restart kahade-backend

# Or with Docker
docker-compose pull
docker-compose up -d --force-recreate
```

### Verify Deployment

```bash
# Check health endpoint
curl -f https://api.kahade.com/health

# Check detailed health
curl https://api.kahade.com/health/detailed

# Check logs
docker-compose logs -f app --tail 100
```

---

## Monitoring

### Key Metrics to Watch

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Error Rate | > 1% | > 5% |
| Response Time (p99) | > 500ms | > 2s |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 70% | > 90% |
| Database Connections | > 80% pool | > 95% pool |
| Redis Memory | > 70% | > 90% |

### Check Application Status

```bash
# Container status
docker ps | grep kahade

# Application logs
docker-compose logs -f app --tail 500

# Error logs only
docker-compose logs app 2>&1 | grep -i error

# Check PM2 status (if using PM2)
pm2 status
pm2 logs kahade-backend
```

### Check Database Status

```bash
# Connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Active queries
psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"

# Table sizes
psql $DATABASE_URL -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 10;"
```

### Check Redis Status

```bash
# Redis info
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD INFO

# Memory usage
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD INFO memory

# Connected clients
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD CLIENT LIST
```

---

## Common Issues

### Issue: High Error Rate

**Symptoms:**
- Increased 5xx errors
- Alerts from monitoring

**Diagnosis:**
```bash
# Check recent errors
docker-compose logs app --since 5m 2>&1 | grep -i error

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connectivity
redis-cli -h $REDIS_HOST ping
```

**Resolution:**
1. Check logs for specific error messages
2. Verify database and Redis are healthy
3. Check for recent deployments
4. Consider rollback if issue started after deployment

### Issue: Slow Response Times

**Symptoms:**
- High latency in monitoring
- User complaints

**Diagnosis:**
```bash
# Check slow queries
psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';"

# Check CPU/Memory
docker stats kahade-backend

# Check connection pool
psql $DATABASE_URL -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"
```

**Resolution:**
1. Kill long-running queries if safe
2. Scale up if resource constrained
3. Check for missing indexes
4. Review recent code changes

### Issue: Database Connection Exhaustion

**Symptoms:**
- "too many connections" errors
- Application timeouts

**Diagnosis:**
```bash
# Check connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check connections by application
psql $DATABASE_URL -c "SELECT application_name, count(*) FROM pg_stat_activity GROUP BY application_name;"
```

**Resolution:**
1. Restart application to release connections
2. Increase `max_connections` in PostgreSQL
3. Reduce `DB_POOL_MAX` in application
4. Check for connection leaks in code

### Issue: Redis Memory Full

**Symptoms:**
- OOM errors in Redis
- Cache operations failing

**Diagnosis:**
```bash
# Check memory usage
redis-cli -h $REDIS_HOST INFO memory

# Check key count
redis-cli -h $REDIS_HOST DBSIZE

# Find large keys
redis-cli -h $REDIS_HOST --bigkeys
```

**Resolution:**
1. Flush expired keys: `redis-cli BGREWRITEAOF`
2. Increase `maxmemory` setting
3. Review TTL settings for cached data
4. Consider Redis cluster for scaling

---

## Database Operations

### Run Migrations

```bash
# Check pending migrations
pnpm prisma migrate status

# Apply migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

### Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3
aws s3 cp backup_*.sql.gz s3://kahade-backups/postgres/
```

### Restore Database

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

### Query Optimization

```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT ...;

# Update table statistics
ANALYZE table_name;

# Reindex table
REINDEX TABLE table_name;
```

---

## Security Incidents

### Suspected Data Breach

1. **Contain:** Disable affected user accounts
2. **Preserve:** Capture logs and evidence
3. **Investigate:** Identify scope and method
4. **Notify:** Alert security team and management
5. **Remediate:** Fix vulnerability and rotate credentials

```bash
# Disable user account
psql $DATABASE_URL -c "UPDATE users SET suspended_at = NOW(), suspend_reason = 'Security investigation' WHERE id = 'user-id';"

# Revoke all sessions
psql $DATABASE_URL -c "UPDATE sessions SET revoked_at = NOW() WHERE user_id = 'user-id';"
```

### Suspected Fraud

1. **Freeze:** Lock affected wallets
2. **Investigate:** Review transaction history
3. **Document:** Record all findings
4. **Escalate:** Notify compliance team

```bash
# Freeze wallet
psql $DATABASE_URL -c "UPDATE wallets SET deleted_at = NOW() WHERE user_id = 'user-id';"

# Get transaction history
psql $DATABASE_URL -c "SELECT * FROM ledger_entries WHERE account_id IN (SELECT id FROM ledger_accounts WHERE wallet_id = 'wallet-id') ORDER BY created_at DESC LIMIT 100;"
```

### DDoS Attack

1. **Identify:** Check traffic patterns
2. **Mitigate:** Enable rate limiting, block IPs
3. **Scale:** Add capacity if needed
4. **Monitor:** Watch for attack evolution

```bash
# Check request rates
docker-compose logs app --since 1m | wc -l

# Block IP at firewall level
iptables -A INPUT -s <attacker-ip> -j DROP
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale application containers
docker-compose up -d --scale app=3

# With Kubernetes
kubectl scale deployment kahade-backend --replicas=5
```

### Vertical Scaling

```bash
# Update resource limits in docker-compose.yml
# Then restart
docker-compose up -d
```

### Database Scaling

1. **Read Replicas:** Add read replicas for read-heavy workloads
2. **Connection Pooling:** Use PgBouncer for connection pooling
3. **Partitioning:** Partition large tables by date

### Redis Scaling

1. **Cluster Mode:** Enable Redis Cluster for horizontal scaling
2. **Memory:** Increase `maxmemory` setting
3. **Persistence:** Adjust RDB/AOF settings based on durability needs

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-call Engineer | PagerDuty | 24/7 |
| Tech Lead | [Contact] | Business hours |
| DBA | [Contact] | On-call |
| Security | [Contact] | On-call |
| CTO | [Contact] | Escalation |

---

## Related Documents

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Rollback Strategy](./docs/ROLLBACK_STRATEGY.md)
- [Disaster Recovery](./docs/DISASTER_RECOVERY.md)
