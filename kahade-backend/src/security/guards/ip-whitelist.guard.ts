import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

// ============================================================================
// IP WHITELIST GUARD
// ============================================================================
// Fix #56: Restricts admin endpoints to whitelisted IP addresses
// ============================================================================

export const IP_WHITELIST_KEY = "ipWhitelist";

/**
 * Decorator to apply IP whitelist to a controller or method
 * @param ips Array of allowed IP addresses or CIDR ranges
 */
export const IpWhitelist = (ips?: string[]) => {
  return (
    target: any,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      IP_WHITELIST_KEY,
      ips || [],
      target,
      propertyKey ?? "",
    );
  };
};

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IpWhitelistGuard.name);
  private readonly globalWhitelist: string[];
  private readonly adminWhitelist: string[];
  private readonly isEnabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    // Global whitelist from environment
    this.globalWhitelist = this.parseIpList(
      this.configService.get<string>("IP_WHITELIST", ""),
    );

    // Admin-specific whitelist
    this.adminWhitelist = this.parseIpList(
      this.configService.get<string>("ADMIN_IP_WHITELIST", ""),
    );

    // Enable/disable IP whitelist (disabled in development by default)
    this.isEnabled =
      this.configService.get<string>("NODE_ENV") === "production" ||
      this.configService.get<string>("ENABLE_IP_WHITELIST") === "true";
  }

  canActivate(context: ExecutionContext): boolean {
    // Skip if not enabled
    if (!this.isEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);

    // Get route-specific whitelist from decorator
    const routeWhitelist =
      this.reflector.get<string[]>(IP_WHITELIST_KEY, context.getHandler()) ||
      this.reflector.get<string[]>(IP_WHITELIST_KEY, context.getClass());

    // Combine whitelists
    const allowedIps = [
      ...this.globalWhitelist,
      ...this.adminWhitelist,
      ...(routeWhitelist || []),
    ];

    // If no whitelist configured, allow all (but log warning)
    if (allowedIps.length === 0) {
      this.logger.warn("IP whitelist is enabled but no IPs are configured");
      return true;
    }

    // Check if client IP is in whitelist
    const isAllowed = this.isIpAllowed(clientIp, allowedIps);

    if (!isAllowed) {
      this.logger.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);
      throw new ForbiddenException("Access denied: IP not whitelisted");
    }

    return true;
  }

  /**
   * Get client IP address, handling proxies
   */
  private getClientIp(request: Request): string {
    // Check X-Forwarded-For header (set by proxies)
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      // Take the first IP (original client)
      return forwarded.split(",")[0].trim();
    }

    // Check X-Real-IP header (set by nginx)
    const realIp = request.headers["x-real-ip"];
    if (typeof realIp === "string") {
      return realIp.trim();
    }

    // Fall back to socket remote address
    return request.ip || request.socket.remoteAddress || "unknown";
  }

  /**
   * Check if IP is in the allowed list (supports CIDR notation)
   */
  private isIpAllowed(clientIp: string, allowedIps: string[]): boolean {
    // Normalize IPv6-mapped IPv4 addresses
    const normalizedClientIp = this.normalizeIp(clientIp);

    for (const allowed of allowedIps) {
      if (allowed.includes("/")) {
        // CIDR notation
        if (this.isIpInCidr(normalizedClientIp, allowed)) {
          return true;
        }
      } else {
        // Exact match
        if (this.normalizeIp(allowed) === normalizedClientIp) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Normalize IP address (handle IPv6-mapped IPv4)
   */
  private normalizeIp(ip: string): string {
    // Remove IPv6 prefix for IPv4-mapped addresses
    if (ip.startsWith("::ffff:")) {
      return ip.substring(7);
    }
    return ip;
  }

  /**
   * Check if IP is within CIDR range
   */
  private isIpInCidr(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split("/");
    const mask = parseInt(bits, 10);

    // Convert IPs to numbers for comparison
    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(range);

    if (ipNum === null || rangeNum === null) {
      return false;
    }

    // Create mask
    const maskNum = ~((1 << (32 - mask)) - 1);

    return (ipNum & maskNum) === (rangeNum & maskNum);
  }

  /**
   * Convert IPv4 address to number
   */
  private ipToNumber(ip: string): number | null {
    const parts = ip.split(".");
    if (parts.length !== 4) {
      return null;
    }

    let num = 0;
    for (const part of parts) {
      const octet = parseInt(part, 10);
      if (isNaN(octet) || octet < 0 || octet > 255) {
        return null;
      }
      num = (num << 8) + octet;
    }

    return num >>> 0; // Convert to unsigned
  }

  /**
   * Parse comma-separated IP list
   */
  private parseIpList(ipList: string): string[] {
    if (!ipList) {
      return [];
    }

    return ipList
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
  }
}
