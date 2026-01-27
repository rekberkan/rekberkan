# Deployment Checklist

This checklist ensures consistent and safe deployments to production.

## Pre-Deployment

### Code Quality

| Item | Status | Notes |
|------|--------|-------|
| All tests passing | ☐ | Run `pnpm test` |
| Linting passes | ☐ | Run `pnpm lint:check` |
| Type checking passes | ☐ | Run `pnpm verify:types` |
| Build succeeds | ☐ | Run `pnpm build` |
| No security vulnerabilities | ☐ | Run `pnpm audit:security` |

### Database

| Item | Status | Notes |
|------|--------|-------|
| Migrations reviewed | ☐ | Check for breaking changes |
| Migrations tested locally | ☐ | Run against test database |
| Rollback plan documented | ☐ | Document rollback steps |
| Backup created | ☐ | Create pre-deployment backup |

### Configuration

| Item | Status | Notes |
|------|--------|-------|
| Environment variables updated | ☐ | Check for new variables |
| Secrets rotated if needed | ☐ | API keys, passwords |
| Feature flags configured | ☐ | Enable/disable features |

### Communication

| Item | Status | Notes |
|------|--------|-------|
| Team notified | ☐ | Slack/email notification |
| Stakeholders informed | ☐ | For significant changes |
| Maintenance window scheduled | ☐ | If downtime expected |

## Deployment

### Execution

| Step | Status | Notes |
|------|--------|-------|
| Pull latest code | ☐ | `git pull origin main` |
| Install dependencies | ☐ | `pnpm install --frozen-lockfile` |
| Run database migrations | ☐ | `pnpm prisma migrate deploy` |
| Build application | ☐ | `pnpm build` |
| Deploy to staging | ☐ | Test in staging first |
| Verify staging | ☐ | Run smoke tests |
| Deploy to production | ☐ | Blue-green or rolling |
| Verify production | ☐ | Health checks pass |

### Rollback Triggers

Initiate rollback if any of these occur:

| Condition | Action |
|-----------|--------|
| Health check fails | Immediate rollback |
| Error rate > 5% | Immediate rollback |
| P99 latency > 5s | Investigate, consider rollback |
| Critical bug reported | Assess and decide |

## Post-Deployment

### Verification

| Item | Status | Notes |
|------|--------|-------|
| Health endpoint returns 200 | ☐ | `curl /health` |
| Detailed health check passes | ☐ | `curl /health/detailed` |
| Key user flows working | ☐ | Manual verification |
| No error spikes in logs | ☐ | Check monitoring |
| Metrics look normal | ☐ | Check dashboards |

### Monitoring

| Item | Status | Notes |
|------|--------|-------|
| Watch error rates for 30 min | ☐ | Alert if > 1% |
| Watch latency for 30 min | ☐ | Alert if P99 > 500ms |
| Check database connections | ☐ | Pool usage normal |
| Check memory usage | ☐ | No memory leaks |

### Documentation

| Item | Status | Notes |
|------|--------|-------|
| Changelog updated | ☐ | Document changes |
| Runbook updated | ☐ | If new procedures |
| API docs updated | ☐ | If API changes |

## Emergency Procedures

### Rollback Steps

1. Stop the current deployment
2. Revert to previous container/build
3. Rollback database if needed (see ROLLBACK_STRATEGY.md)
4. Verify health checks
5. Notify team of rollback

### Contact List

| Role | Contact | When to Contact |
|------|---------|-----------------|
| On-call Engineer | PagerDuty | Any deployment issue |
| Tech Lead | [Contact] | Major issues |
| DBA | [Contact] | Database issues |
| CTO | [Contact] | Critical incidents |

## Deployment Commands

```bash
# Full deployment sequence
git pull origin main
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 restart kahade-backend

# Docker deployment
docker-compose pull
docker-compose up -d --force-recreate

# Verify deployment
curl -f http://localhost:3000/health
curl http://localhost:3000/health/detailed

# Check logs
docker-compose logs -f app --tail 100
```

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Reviewer | | | |
| Approver | | | |
