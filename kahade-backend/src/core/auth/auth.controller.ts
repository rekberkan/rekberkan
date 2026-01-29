import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  Ip,
  Headers,
  Delete,
  Param,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import {
  ResetPasswordDto,
  ForgotPasswordDto,
  ChangePasswordDto,
} from "./dto/reset-password.dto";
import { MfaVerifyDto, MfaDisableDto } from "./dto/mfa-verify.dto";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Public } from "@common/decorators/public.decorator";
import { CookieUtil } from "@common/utils/cookie.util";
import { ConfigService } from "@nestjs/config";

// ============================================================================
// AUTH CONTROLLER - Production Ready
// SECURITY FIX [C-01]: Implements HttpOnly cookie-based authentication
// ============================================================================

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================================
  // REGISTRATION - Strict rate limit to prevent abuse
  // ============================================================================

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // SECURITY FIX [C-01]: Set tokens in HttpOnly cookies instead of response body
    const csrfToken = CookieUtil.generateCsrfToken();
    CookieUtil.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      csrfToken,
      this.configService,
    );

    // Set CSRF token in response header for frontend to read
    res.setHeader("x-csrf-token", csrfToken);

    // Return user data only (tokens are in cookies)
    return {
      user: result.user,
      expiresIn: result.expiresIn,
    };
  }

  // ============================================================================
  // LOGIN - Rate limited to prevent brute force
  // ============================================================================

  @Public()
  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 403, description: "Account locked" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, ip, userAgent);

    // SECURITY FIX [C-01]: Set tokens in HttpOnly cookies instead of response body
    const csrfToken = CookieUtil.generateCsrfToken();
    CookieUtil.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      csrfToken,
      this.configService,
    );

    // Set CSRF token in response header for frontend to read
    res.setHeader("x-csrf-token", csrfToken);

    // Return user data only (tokens are in cookies)
    return {
      user: result.user,
      expiresIn: result.expiresIn,
    };
  }

  // ============================================================================
  // TOKEN REFRESH
  // ============================================================================

  @Public()
  @Post("refresh")
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // SECURITY FIX [C-01]: Get refresh token from cookie if not in body
    const refreshToken =
      refreshTokenDto?.refreshToken ||
      CookieUtil.getRefreshTokenFromCookie(req.cookies || {});

    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const result = await this.authService.refreshToken(refreshToken);

    // SECURITY FIX [C-01]: Set new tokens in HttpOnly cookies
    const csrfToken = CookieUtil.generateCsrfToken();
    CookieUtil.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      csrfToken,
      this.configService,
    );

    // Set CSRF token in response header for frontend to read
    res.setHeader("x-csrf-token", csrfToken);

    return {
      expiresIn: result.expiresIn,
    };
  }

  // ============================================================================
  // LOGOUT
  // ============================================================================

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  async logout(
    @CurrentUser("id") userId: string,
    @Request() req: any,
    @Body("refreshToken") refreshToken?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    // SECURITY FIX [C-01]: Get tokens from cookies if not in request
    const accessToken =
      req.headers.authorization?.split(" ")[1] ||
      CookieUtil.getAccessTokenFromCookie(req.cookies || {});
    const actualRefreshToken =
      refreshToken || CookieUtil.getRefreshTokenFromCookie(req.cookies || {});

    const result = await this.authService.logout(
      userId,
      accessToken,
      actualRefreshToken,
    );

    // SECURITY FIX [C-01]: Clear authentication cookies
    if (res) {
      CookieUtil.clearAuthCookies(res, this.configService);
    }

    return result;
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout from all devices" })
  @ApiResponse({ status: 200, description: "Logged out from all devices" })
  async logoutAll(
    @CurrentUser("id") userId: string,
    @Request() req: any,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const accessToken =
      req.headers.authorization?.split(" ")[1] ||
      CookieUtil.getAccessTokenFromCookie(req.cookies || {});

    const result = await this.authService.logoutAll(userId, accessToken);

    // SECURITY FIX [C-01]: Clear authentication cookies
    if (res) {
      CookieUtil.clearAuthCookies(res, this.configService);
    }

    return result;
  }

  // ============================================================================
  // CURRENT USER
  // ============================================================================

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @SkipThrottle()
  @ApiOperation({ summary: "Get current user" })
  @ApiResponse({ status: 200, description: "Returns current user" })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  // ============================================================================
  // PASSWORD RESET - Strict rate limit
  // ============================================================================

  @Public()
  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent (if account exists)",
  })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successful" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change password (authenticated)" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 401, description: "Current password incorrect" })
  async changePassword(
    @CurrentUser("id") userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  @Public()
  @Post("verify-email")
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email address" })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async verifyEmail(@Body() dto: { token: string }) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post("resend-verification")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend verification email (authenticated)" })
  @ApiResponse({ status: 200, description: "Verification email sent" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async resendVerification(@CurrentUser() user: any) {
    // Use authenticated user's email
    return this.authService.resendVerificationEmail(user.email);
  }

  @Public()
  @Post("resend-verification-public")
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend verification email (public)" })
  @ApiResponse({
    status: 200,
    description: "Verification email sent (if account exists)",
  })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async resendVerificationPublic(@Body() dto: { email: string }) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  // ============================================================================
  // MFA / 2FA
  // ============================================================================

  @Post("2fa/enable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Initiate MFA setup" })
  @ApiResponse({ status: 200, description: "Returns MFA setup details" })
  async setupMfa(@CurrentUser("id") userId: string) {
    return this.authService.setupMfa(userId);
  }

  @Post("2fa/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Verify MFA and enable" })
  @ApiResponse({ status: 200, description: "MFA enabled" })
  async verifyMfa(
    @CurrentUser("id") userId: string,
    @Body() dto: MfaVerifyDto,
  ) {
    return this.authService.enableMfa(userId, dto.code);
  }

  @Post("2fa/disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Disable MFA" })
  @ApiResponse({ status: 200, description: "MFA disabled" })
  async disableMfa(
    @CurrentUser("id") userId: string,
    @Body() dto: MfaDisableDto,
  ) {
    return this.authService.disableMfa(userId, dto.password, dto.code);
  }

  // ============================================================================
  // SESSIONS
  // ============================================================================

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "List active sessions" })
  @ApiResponse({ status: 200, description: "Returns active sessions" })
  async getSessions(@CurrentUser("id") userId: string) {
    const sessions = await this.authService.listSessions(userId);
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      revokedAt: session.revokedAt,
    }));
  }

  @Delete("sessions/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Revoke a session" })
  @ApiResponse({ status: 200, description: "Session revoked" })
  async revokeSession(
    @CurrentUser("id") userId: string,
    @Param("id") sessionId: string,
  ) {
    return this.authService.revokeSession(userId, sessionId);
  }

  @Delete("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Revoke all sessions" })
  @ApiResponse({ status: 200, description: "All sessions revoked" })
  async revokeAllSessions(@CurrentUser("id") userId: string) {
    return this.authService.revokeAllSessions(userId);
  }
}
