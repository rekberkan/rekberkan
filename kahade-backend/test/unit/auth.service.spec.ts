/**
 * Auth Service Unit Tests
 * 
 * QUALITY FIX [H004]: Added comprehensive test coverage for authentication
 * Tests: registration, login, logout, token refresh, password validation, brute force protection
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, IAuthResponse } from '../../src/core/auth/auth.service';
import { UserService } from '../../src/core/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from '../../src/core/auth/token-blacklist.service';
import { SessionRepository } from '../../src/core/auth/session.repository';
import { MFAService } from '../../src/core/auth/mfa.service';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let mfaService: jest.Mocked<MFAService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$hashedpassword',
    isAdmin: false,
    mfaEnabled: false,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateLastLogin: jest.fn(),
            sanitizeUser: jest.fn((user) => ({
              id: user.id,
              email: user.email,
              username: user.username,
              isAdmin: user.isAdmin,
            })),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'jwt.secret': 'test-secret-key-for-jwt-signing-32chars',
                'jwt.refreshSecret': 'test-refresh-secret-key-32chars',
                'jwt.expiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            isBlacklisted: jest.fn(),
            blacklistToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            storeRefreshToken: jest.fn(),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            create: jest.fn(),
            findByToken: jest.fn(),
            revokeByUserId: jest.fn(),
            revoke: jest.fn(),
          },
        },
        {
          provide: MFAService,
          useValue: {
            verifyTOTP: jest.fn(),
            verifyBackupCode: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    sessionRepository = module.get(SessionRepository);
    mfaService = module.get(MFAService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'SecurePass123!',
      phone: '+6281234567890',
    };

    it('should register a new user successfully', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValue('mock-token');
      sessionRepository.create.mockResolvedValue({} as any);
      tokenBlacklistService.storeRefreshToken.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw BadRequestException if email already exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for weak password', async () => {
      const weakPasswordDto = { ...registerDto, password: '123' };

      await expect(service.register(weakPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should normalize email to lowercase', async () => {
      const upperCaseEmailDto = { ...registerDto, email: 'USER@EXAMPLE.COM' };
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValue('mock-token');
      sessionRepository.create.mockResolvedValue({} as any);
      tokenBlacklistService.storeRefreshToken.mockResolvedValue(undefined);

      await service.register(upperCaseEmailDto);

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
        }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    beforeEach(() => {
      // Reset failed attempts before each test
      (service as any).failedAttempts.clear();
    });

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };
      
      userService.findByEmail.mockResolvedValue(userWithHash as any);
      jwtService.signAsync.mockResolvedValue('mock-token');
      sessionRepository.create.mockResolvedValue({} as any);
      tokenBlacklistService.storeRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const wrongPasswordDto = { ...loginDto, password: 'wrongpassword' };
      userService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.login(wrongPasswordDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should lock account after max failed attempts', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      const wrongPasswordDto = { ...loginDto, password: 'wrongpassword' };

      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        try {
          await service.login(wrongPasswordDto);
        } catch (e) {
          // Expected to fail
        }
      }

      // 6th attempt should be blocked
      await expect(service.login(wrongPasswordDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const userId = 'user-123';
      const refreshToken = 'valid-refresh-token';
      
      tokenBlacklistService.blacklistToken.mockResolvedValue(undefined);
      sessionRepository.revoke.mockResolvedValue(undefined);

      await expect(service.logout(userId, refreshToken)).resolves.not.toThrow();
      expect(tokenBlacklistService.blacklistToken).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const session = {
        id: 'session-123',
        userId: 'user-123',
        refreshHash: await bcrypt.hash(oldRefreshToken, 10),
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      };

      // Mock validateRefreshToken to return userId
      tokenBlacklistService.validateRefreshToken.mockResolvedValue('user-123');
      sessionRepository.findByToken.mockResolvedValue(session as any);
      // Mock JWT verify
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-123' });
      (jwtService as any).verify = jest.fn().mockReturnValue({ sub: 'user-123' });
      userService.findById.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValue('new-token');
      sessionRepository.create.mockResolvedValue({} as any);
      tokenBlacklistService.revokeRefreshToken.mockResolvedValue(undefined);
      sessionRepository.revoke.mockResolvedValue(undefined);
      tokenBlacklistService.storeRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshToken(oldRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      tokenBlacklistService.validateRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      const expiredSession = {
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 86400000), // Expired
        revokedAt: null,
      };

      tokenBlacklistService.validateRefreshToken.mockResolvedValue('user-123');
      sessionRepository.findByToken.mockResolvedValue(expiredSession as any);

      await expect(service.refreshToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd!2024',
        'C0mpl3x!Pass',
      ];

      strongPasswords.forEach((password) => {
        expect(() => (service as any).validatePasswordStrength(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '12345678',      // No letters
        'password',      // No numbers or special chars
        'Pass1!',        // Too short
        'abcdefgh',      // No numbers or special chars
      ];

      weakPasswords.forEach((password) => {
        expect(() => (service as any).validatePasswordStrength(password)).toThrow(BadRequestException);
      });
    });
  });

  // Note: MFA verification tests are complex due to internal service dependencies.
  // The MFA functionality is tested separately in mfa.service.spec.ts.
  // Integration tests should be added to test the full MFA login flow.
});
