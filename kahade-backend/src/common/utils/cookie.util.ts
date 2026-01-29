import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * Cookie Utility for Secure Token Storage
 *
 * SECURITY FIX [C-01]: Implements HttpOnly cookies for JWT tokens
 * - Prevents XSS attacks from stealing tokens
 * - Implements secure cookie handling with proper flags
 * - Supports cross-subdomain authentication
 */

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  domain?: string;
  path: string;
  maxAge: number;
}

export class CookieUtil {
  private static readonly ACCESS_TOKEN_COOKIE = "rekberkan_access_token";
  private static readonly REFRESH_TOKEN_COOKIE = "rekberkan_refresh_token";
  private static readonly CSRF_TOKEN_COOKIE = "XSRF-TOKEN";

  /**
   * Get default cookie options for secure token storage
   */
  static getSecureCookieOptions(
    configService: ConfigService,
    maxAgeSeconds: number,
    httpOnly: boolean = true,
  ): CookieOptions {
    const isProduction = configService.get<string>("NODE_ENV") === "production";
    const domain = configService.get<string>("COOKIE_DOMAIN");

    return {
      httpOnly,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? "strict" : "lax",
      domain: domain || undefined,
      path: "/",
      maxAge: maxAgeSeconds * 1000, // Convert to milliseconds
    };
  }

  /**
   * Set access token in HttpOnly cookie
   */
  static setAccessToken(
    res: Response,
    token: string,
    configService: ConfigService,
    expiresInSeconds: number = 900, // 15 minutes default
  ): void {
    const options = this.getSecureCookieOptions(
      configService,
      expiresInSeconds,
      true,
    );
    res.cookie(this.ACCESS_TOKEN_COOKIE, token, options);
  }

  /**
   * Set refresh token in HttpOnly cookie
   */
  static setRefreshToken(
    res: Response,
    token: string,
    configService: ConfigService,
    expiresInSeconds: number = 604800, // 7 days default
  ): void {
    const options = this.getSecureCookieOptions(
      configService,
      expiresInSeconds,
      true,
    );
    res.cookie(this.REFRESH_TOKEN_COOKIE, token, options);
  }

  /**
   * Set CSRF token in non-HttpOnly cookie (needs to be read by JavaScript)
   */
  static setCsrfToken(
    res: Response,
    token: string,
    configService: ConfigService,
    expiresInSeconds: number = 86400, // 24 hours default
  ): void {
    const options = this.getSecureCookieOptions(
      configService,
      expiresInSeconds,
      false,
    );
    res.cookie(this.CSRF_TOKEN_COOKIE, token, options);
  }

  /**
   * Set all authentication cookies at once
   */
  static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    csrfToken: string,
    configService: ConfigService,
  ): void {
    this.setAccessToken(res, accessToken, configService);
    this.setRefreshToken(res, refreshToken, configService);
    this.setCsrfToken(res, csrfToken, configService);
  }

  /**
   * Clear all authentication cookies
   */
  static clearAuthCookies(res: Response, configService: ConfigService): void {
    const domain = configService.get<string>("COOKIE_DOMAIN");
    const cookieOptions = {
      httpOnly: true,
      secure: configService.get<string>("NODE_ENV") === "production",
      sameSite: "strict" as const,
      domain: domain || undefined,
      path: "/",
    };

    res.clearCookie(this.ACCESS_TOKEN_COOKIE, cookieOptions);
    res.clearCookie(this.REFRESH_TOKEN_COOKIE, cookieOptions);
    res.clearCookie(this.CSRF_TOKEN_COOKIE, {
      ...cookieOptions,
      httpOnly: false,
    });
  }

  /**
   * Get access token from cookie
   */
  static getAccessTokenFromCookie(
    cookies: Record<string, string>,
  ): string | undefined {
    return cookies[this.ACCESS_TOKEN_COOKIE];
  }

  /**
   * Get refresh token from cookie
   */
  static getRefreshTokenFromCookie(
    cookies: Record<string, string>,
  ): string | undefined {
    return cookies[this.REFRESH_TOKEN_COOKIE];
  }

  /**
   * Generate CSRF token
   */
  static generateCsrfToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
