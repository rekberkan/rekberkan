# Security Policy

## 🔒 Reporting Security Vulnerabilities

If you discover a security vulnerability, please email us at:

**security@kahade.com**

Please do NOT create public GitHub issues for security vulnerabilities.

## 🔑 Environment Variables & Secret Management

### ⚠️ CRITICAL: Never Commit Real Secrets!

**All `.env.*` files are gitignored. Use them locally ONLY.**

### Development Setup:

```bash
# 1. Copy the example file
cp .env.example .env.development

# 2. Fill in your LOCAL credentials
# Edit .env.development with your values

# 3. Verify it's gitignored
git status  # Should NOT show .env.development
```

### Production Deployment:

**NEVER use `.env.production` files with real secrets in Git!**

Use one of these methods:

1. **CI/CD Environment Variables** (Recommended)
   - GitHub Actions Secrets
   - GitLab CI Variables
   - CircleCI Environment Variables

2. **Secret Management Systems**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Secret Manager

3. **Docker Secrets** (for Docker Swarm)
4. **Kubernetes Secrets** (for K8s)

## 🔄 Secret Rotation Schedule

| Secret Type | Rotation Frequency | Priority |
|------------|-------------------|----------|
| JWT Secrets | Every 90 days | HIGH |
| Database Passwords | Every 90 days | CRITICAL |
| Payment Gateway Keys | Every 180 days | CRITICAL |
| Blockchain Private Keys | Never rotate - use new wallet | CRITICAL |
| Email Passwords | Every 180 days | MEDIUM |
| Redis Passwords | Every 180 days | HIGH |
| API Keys (3rd party) | Every 180 days | MEDIUM |

### Rotation Checklist:

- [ ] Generate new secret
- [ ] Update in secret manager / CI/CD
- [ ] Deploy with zero-downtime strategy
- [ ] Verify new secret works
- [ ] Revoke old secret
- [ ] Update rotation log

## 🛡️ Security Checklist Before Production

### Environment:
- [ ] `NODE_ENV=production`
- [ ] `DEBUG=false`
- [ ] `LOG_LEVEL=warn` or `error`
- [ ] No `.env.*` files with real secrets in repo
- [ ] All secrets in secret manager

### Dependencies:
- [ ] Run `npm audit --production` → 0 critical vulnerabilities
- [ ] All dependencies up-to-date
- [ ] No deprecated packages

### Security Headers:
- [ ] Helmet middleware enabled
- [ ] CORS properly configured (no `*` wildcard in production)
- [ ] Rate limiting active
- [ ] CSRF protection enabled

### Authentication:
- [ ] Strong JWT secrets (min 32 characters)
- [ ] Token expiration configured (15m access, 7d refresh)
- [ ] Refresh token rotation implemented
- [ ] Password hashing with bcrypt (rounds >= 12)
- [ ] MFA enabled for admin accounts

### Network:
- [ ] HTTPS enforced (no HTTP in production)
- [ ] Database not exposed to public internet
- [ ] Redis not exposed to public internet
- [ ] Firewall rules configured

### Blockchain:
- [ ] Private keys in hardware wallet or HSM
- [ ] Gas price limits configured
- [ ] Transaction replay protection
- [ ] Contract address whitelist

### Data Protection:
- [ ] Database backups automated (daily minimum)
- [ ] Backup restoration tested
- [ ] PII encrypted at rest
- [ ] Sensitive data redacted from logs

### Monitoring:
- [ ] Error tracking configured (Sentry/New Relic)
- [ ] Security event logging
- [ ] Anomaly detection alerts
- [ ] Uptime monitoring

## 🚨 Incident Response Plan

### If Secrets are Compromised:

1. **IMMEDIATE (0-15 minutes)**
   - Revoke compromised credentials
   - Block affected accounts
   - Alert team

2. **SHORT-TERM (15-60 minutes)**
   - Rotate all related secrets
   - Deploy emergency patch
   - Review access logs

3. **FOLLOW-UP (1-24 hours)**
   - Conduct post-mortem
   - Update incident log
   - Improve security controls
   - Notify affected users (if applicable)

### If Database is Breached:

1. **IMMEDIATE**
   - Isolate database
   - Stop all write operations
   - Alert team and management

2. **SHORT-TERM**
   - Assess breach scope
   - Preserve evidence
   - Restore from clean backup
   - Force password reset for all users

3. **FOLLOW-UP**
   - Notify authorities (if required)
   - Notify affected users
   - Legal consultation
   - Security audit

## 📋 Security Audit Logs

### Latest Audit: January 2026
- Type: Internal Bank-Grade Security Audit
- Status: Phase A Complete
- Findings: 4 issues identified and fixed
- Next Audit: April 2026

## 🔗 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

## 📞 Contact

- Security Team: security@kahade.com
- Emergency Hotline: +62-xxx-xxxx-xxxx (24/7)
- PGP Key: [To be added]

---

**Last Updated:** January 20, 2026  
**Version:** 1.0.0