export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

export enum KYCStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface IUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  passwordUpdatedAt?: Date;
  lastLoginAt?: Date;
  failedLoginCount: number;
  lockedUntil?: Date;
  mfaEnabled: boolean;
  totpSecretEnc?: string;
  backupCodesHash?: any;
  emailVerifiedAt?: Date;
  kycStatus: KYCStatus;
  reputationScore: number;
  totalTransactions: number;
  isAdmin: boolean;
  deletedAt?: Date;
  deletedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  phone?: string;
  kycStatus: KYCStatus;
  reputationScore: number;
  totalTransactions: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}
