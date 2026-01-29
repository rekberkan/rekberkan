import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "@common/decorators/public.decorator";

/**
 * BANK-GRADE JWT Guard
 * Implements proper JWT validation with security best practices
 */
@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn("No token provided in request");
      throw new UnauthorizedException({
        code: "TOKEN_MISSING",
        message: "Access token is required",
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("jwt.secret"),
      });

      // Validate token payload
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException({
          code: "INVALID_TOKEN_PAYLOAD",
          message: "Invalid token payload",
        });
      }

      // Attach user to request
      request["user"] = {
        id: payload.sub,
        email: payload.email,
        role: payload.role || "USER",
        isAdmin: payload.isAdmin || false,
      };

      return true;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        this.logger.warn("Token expired");
        throw new UnauthorizedException({
          code: "TOKEN_EXPIRED",
          message: "Access token has expired",
        });
      }

      if (error.name === "JsonWebTokenError") {
        this.logger.warn("Invalid token");
        throw new UnauthorizedException({
          code: "INVALID_TOKEN",
          message: "Invalid access token",
        });
      }

      this.logger.error(`JWT validation error: ${error.message}`);
      throw new UnauthorizedException({
        code: "AUTH_FAILED",
        message: "Authentication failed",
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(" ");
    return type === "Bearer" ? token : undefined;
  }
}
