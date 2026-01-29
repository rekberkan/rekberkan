import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UserService } from "@core/user/user.service";
import { IAuthUser } from "@common/interfaces/user.interface";
import { Request } from "express";

/**
 * JWT Strategy - SECURITY ENHANCED
 *
 * SECURITY FIX [C-01]: Supports both cookie-based and header-based JWT extraction
 * - Primary: Extract JWT from HttpOnly cookie (more secure)
 * - Fallback: Extract JWT from Authorization header (for backward compatibility)
 */

// Custom extractor that checks both cookie and header
const cookieExtractor = (req: Request): string | null => {
  // SECURITY FIX [C-01]: First try to extract from HttpOnly cookie
  if (req && req.cookies) {
    const cookieToken = req.cookies["rekberkan_access_token"];
    if (cookieToken) {
      return cookieToken;
    }
  }

  // Fallback: Extract from Authorization header (for backward compatibility)
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      // SECURITY FIX [C-01]: Use custom extractor that supports both cookie and header
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("jwt.secret"),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    iat: number;
    exp: number;
  }): Promise<IAuthUser> {
    const user = (await this.userService.findById(payload.sub)) as any;

    if (!user) {
      throw new UnauthorizedException("User found in token no longer exists");
    }

    if (user.status && user.status !== "ACTIVE") {
      throw new UnauthorizedException("User account is currently restricted");
    }

    // Check if user is suspended
    if (user.suspendedAt) {
      throw new UnauthorizedException("User account is suspended");
    }

    // SECURITY: Return sanitized identity
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      role: user.isAdmin ? "ADMIN" : "USER",
    } as IAuthUser;
  }
}
