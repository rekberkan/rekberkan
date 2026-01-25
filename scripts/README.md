# Utility Scripts

Collection of utility scripts for Kahade backend management.

## Available Scripts

### Setup

**setup-dev.sh** - Setup development environment

```bash
./scripts/setup-dev.sh
```

### Database Management

**backup-db.sh** - Backup PostgreSQL database

```bash
./scripts/backup-db.sh
```

**restore-db.sh** - Restore database from backup

```bash
./scripts/restore-db.sh backups/kahade_backup_20240120.sql.gz
```

**test-db-connection.sh** - Test database connectivity

```bash
./scripts/test-db-connection.sh
```

### Redis

**test-redis-connection.sh** - Test Redis connectivity

```bash
./scripts/test-redis-connection.sh
```

### Environment

**check-env.sh** - Validate environment variables

```bash
./scripts/check-env.sh
```

### Security

**generate-secret.js** - Generate secure secrets

```bash
node scripts/generate-secret.js
```

### Git Hooks

**pre-commit.sh** - Pre-commit validation

```bash
./scripts/pre-commit.sh
```

## Making Scripts Executable

```bash
chmod +x scripts/*.sh
```

## Automation

### Cron Jobs

Add to crontab for automated backups:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/kahade-backend/scripts/backup-db.sh
```

### CI/CD Integration

Use these scripts in your CI/CD pipeline:

```yaml
- name: Check environment
  run: ./scripts/check-env.sh

- name: Test database connection
  run: ./scripts/test-db-connection.sh
```
