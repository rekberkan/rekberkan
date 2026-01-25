# Authorization

## Objective
Authorization enforces least privilege access to protect sensitive financial operations. Policies combine role-based access control (RBAC) with contextual controls like IP allowlists and device trust.

## Role-Based Access Control (RBAC)
- Predefined roles (e.g., user, admin, compliance) with explicit permissions.
- Permission checks required at both API endpoint and service layer.
- Admin-only routes protected by elevated MFA and policy enforcement.

## IP-Based Security Controls
- **Allowlist/denylist** per tenant or organization.
- **Geo-restrictions** for high-risk regions.
- **Dynamic IP reputation** checks against known threat sources.
- **Session invalidation** on IP change for high-risk operations.

## Conditional Access
- Enforce **step-up authentication** based on risk score.
- Restrict access to financial exports unless on trusted IPs.
- Require device registration for admin access.

## Auditable Decisions
All authorization decisions are logged with policy metadata to support compliance and forensic analysis.
