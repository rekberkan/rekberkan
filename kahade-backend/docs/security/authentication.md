# Authentication

## Objective
Kahade targets bank-grade authentication by combining strong credential hygiene with step-up verification and continuous risk evaluation. This ensures that access to financial data and transaction approval flows always require multiple layers of assurance.

## Multi-Factor Authentication (MFA)
MFA is required for high-risk actions (logins from new devices, withdrawals, payout changes, and admin access).

**Supported factor types**
- **TOTP** (RFC 6238) using authenticator apps.
- **One-time codes** delivered via verified channels (email/SMS) for recovery or fallback.
- **WebAuthn/FIDO2** for hardware-backed phishing-resistant authentication (roadmap item).

**MFA workflow**
1. Primary credential verification (username/password or SSO).
2. Risk evaluation (device fingerprint, IP reputation, geo-velocity, session age).
3. MFA prompt when risk score exceeds threshold or for protected actions.
4. MFA validation creates a short-lived elevated session token.

## Session Security
- **Short-lived access tokens** with refresh token rotation.
- **Device binding** to prevent token reuse on untrusted devices.
- **Suspicious session detection** based on IP changes, UA mismatch, and impossible travel checks.

## Operational Controls
- MFA recovery requires **identity verification** and **audit trail approval**.
- Rate limiting and lockout thresholds protect against credential stuffing.

## Monitoring
Authentication events feed the audit log for traceability and anomaly detection.
