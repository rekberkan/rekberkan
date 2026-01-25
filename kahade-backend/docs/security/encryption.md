# Encryption

## Objective
Financial data is protected using layered encryption at rest, in transit, and in use. Keys and cryptographic operations follow industry best practices (NIST, PCI-DSS, ISO 27001).

## Data in Transit
- **TLS 1.2+** required for all external and internal service communication.
- **HSTS** enforced at the edge to prevent downgrade attacks.
- **mTLS** for service-to-service communications where feasible.

## Data at Rest
- **Database encryption** at the storage layer (disk/volume encryption).
- **Field-level encryption** for sensitive payloads (e.g., payout details, KYC data).
- **Key separation** between data encryption keys (DEK) and key encryption keys (KEK).

## Key Management
- **Centralized KMS** for key storage, rotation, and access policy.
- **Rotation policy**: regular rotation of DEKs and KEKs with automated re-encryption.
- **Least privilege** enforced for key usage; audit logging required for every key access.

## Tokenization & Masking
- Sensitive identifiers (bank account numbers, card data) are **tokenized** in logs and analytics.
- PII masking enforced in audit and observability pipelines.

## Secure Cryptographic Standards
- Symmetric encryption: **AES-256-GCM**.
- Hashing: **SHA-256/512** with salts for secrets.
- Password storage: **bcrypt/argon2** with strong cost parameters.
