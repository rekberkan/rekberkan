// ============================================================================
// RBAC: ROLES ENUMERATION
// ============================================================================

export enum Role {
  // Super Admin - Full system access
  SUPER_ADMIN = 'SUPER_ADMIN',
  
  // Admin - Platform management
  ADMIN = 'ADMIN',
  
  // Finance Team - Financial operations
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  
  // Support Team - Customer support
  SUPPORT_MANAGER = 'SUPPORT_MANAGER',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  
  // Compliance - KYC & AML
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  
  // Regular Users
  USER = 'USER',
  VERIFIED_USER = 'VERIFIED_USER',  // KYC verified
  PREMIUM_USER = 'PREMIUM_USER',    // Premium features
}

// Role hierarchy (higher roles inherit lower role permissions)
export const RoleHierarchy: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 1000,
  [Role.ADMIN]: 900,
  [Role.FINANCE_MANAGER]: 800,
  [Role.COMPLIANCE_OFFICER]: 700,
  [Role.SUPPORT_MANAGER]: 600,
  [Role.FINANCE_OFFICER]: 500,
  [Role.SUPPORT_AGENT]: 400,
  [Role.PREMIUM_USER]: 300,
  [Role.VERIFIED_USER]: 200,
  [Role.USER]: 100,
};

export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}