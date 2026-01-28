import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * BANK-GRADE Roles Guard
 * Implements proper role-based access control with admin verification
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Validate user exists
    if (!user) {
      this.logger.warn('User not found in request');
      throw new ForbiddenException({
        code: 'USER_NOT_FOUND',
        message: 'User authentication required',
      });
    }

    // Validate user has role property
    if (!user.role) {
      this.logger.warn(`User ${user.id} has no role assigned`);
      throw new ForbiddenException({
        code: 'ROLE_NOT_FOUND',
        message: 'User role not found',
      });
    }

    // Check if ADMIN role is required
    const requiresAdmin = requiredRoles.includes('ADMIN');

    if (requiresAdmin) {
      // For ADMIN role, verify both role AND isAdmin flag for extra security
      const isAdmin = user.role === 'ADMIN' && user.isAdmin === true;

      if (!isAdmin) {
        this.logger.warn(`User ${user.id} attempted admin access without proper privileges`);
        throw new ForbiddenException({
          code: 'ADMIN_ACCESS_DENIED',
          message: 'Administrator privileges required',
        });
      }

      return true;
    }

    // Check if MODERATOR role is required
    const requiresModerator = requiredRoles.includes('MODERATOR');

    if (requiresModerator) {
      // Moderators and Admins can access moderator routes
      const hasModerationAccess =
        user.role === 'MODERATOR' || (user.role === 'ADMIN' && user.isAdmin === true);

      if (!hasModerationAccess) {
        this.logger.warn(`User ${user.id} attempted moderator access without proper privileges`);
        throw new ForbiddenException({
          code: 'MODERATOR_ACCESS_DENIED',
          message: 'Moderator privileges required',
        });
      }

      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} with role ${user.role} attempted to access route requiring: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions for this action',
      });
    }

    return true;
  }
}
