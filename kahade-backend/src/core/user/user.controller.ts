import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { UserService } from "./user.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UploadKycDto } from "./dto/upload-kyc.dto";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Express } from "express";
import { memoryStorage } from "multer";

// ============================================================================
// USER CONTROLLER - Bank-Grade Security
// Implements: Rate Limiting, File Validation, Input Sanitization
// ============================================================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB for avatars

@ApiTags("user")
@Controller("user")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Returns user profile" })
  async getProfile(@CurrentUser("id") userId: string) {
    const user = await this.userService.findById(userId);
    return this.userService.sanitizeUser(user);
  }

  @Patch("profile")
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 updates per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updateUserDto);
  }

  @Post("change-password")
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 password changes per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change user password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Invalid current password" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async changePassword(
    @CurrentUser("id") userId: string,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    // Validate input
    if (!dto.currentPassword || typeof dto.currentPassword !== "string") {
      throw new BadRequestException("Current password is required");
    }
    if (!dto.newPassword || typeof dto.newPassword !== "string") {
      throw new BadRequestException("New password is required");
    }
    if (dto.newPassword.length < 8) {
      throw new BadRequestException(
        "New password must be at least 8 characters",
      );
    }
    if (dto.newPassword.length > 128) {
      throw new BadRequestException(
        "New password must not exceed 128 characters",
      );
    }
    // Check password strength
    const hasUppercase = /[A-Z]/.test(dto.newPassword);
    const hasLowercase = /[a-z]/.test(dto.newPassword);
    const hasNumber = /[0-9]/.test(dto.newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(dto.newPassword);
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw new BadRequestException(
        "Password must contain uppercase, lowercase, number, and special character",
      );
    }

    return this.userService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post("kyc")
  @Throttle({ default: { limit: 3, ttl: 86400000 } }) // 3 KYC submissions per day
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Upload KYC documents" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "KYC documents uploaded" })
  @ApiResponse({ status: 400, description: "Invalid file or data" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @UseInterceptors(
    FileInterceptor("document", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              "Invalid file type. Allowed: JPEG, PNG, WebP, PDF",
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadKYC(
    @CurrentUser("id") userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadKycDto,
  ) {
    if (!file) {
      throw new BadRequestException("Document file is required");
    }
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Allowed: JPEG, PNG, WebP, PDF",
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("File size exceeds 5MB limit");
    }
    // Validate file content (magic bytes check)
    const validSignatures: Record<string, Buffer[]> = {
      "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
      "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
      "image/webp": [Buffer.from([0x52, 0x49, 0x46, 0x46])],
      "application/pdf": [Buffer.from([0x25, 0x50, 0x44, 0x46])],
    };
    const signatures = validSignatures[file.mimetype];
    if (signatures) {
      const fileHeader = file.buffer.subarray(0, 4);
      const isValid = signatures.some((sig) =>
        fileHeader.subarray(0, sig.length).equals(sig),
      );
      if (!isValid) {
        throw new BadRequestException(
          "File content does not match declared type",
        );
      }
    }

    return this.userService.uploadKYCDocument(userId, file, dto);
  }

  @Post("avatar")
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 avatar uploads per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upload user avatar" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "Avatar updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid file" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_SIZE },
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException("Avatar must be JPEG, PNG, or WebP"),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser("id") userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Avatar file is required");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Avatar must be JPEG, PNG, or WebP");
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException("Avatar file size must not exceed 2MB");
    }

    return this.userService.updateAvatar(userId, file);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get user statistics" })
  @ApiResponse({ status: 200, description: "Returns user statistics" })
  async getStats(@CurrentUser("id") userId: string) {
    return this.userService.getStats(userId);
  }

  @Patch("notification-settings")
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 updates per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update notification settings" })
  @ApiResponse({ status: 200, description: "Notification settings updated" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async updateNotificationSettings(
    @CurrentUser("id") userId: string,
    @Body()
    settings: {
      email?: boolean;
      push?: boolean;
      transaction?: boolean;
      marketing?: boolean;
    },
  ) {
    return this.userService.updateNotificationSettings(userId, {
      email: !!settings.email,
      push: !!settings.push,
      transaction: !!settings.transaction,
      marketing: !!settings.marketing,
    });
  }

  @Get(":id/ratings")
  @ApiOperation({ summary: "Get user ratings" })
  @ApiResponse({ status: 200, description: "Returns user ratings" })
  async getUserRatings(@Param("id", ParseUUIDPipe) userId: string) {
    return this.userService.getUserRatings(userId);
  }
}

// ============================================================================
// USERS CONTROLLER - Public User Lookup
// ============================================================================

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "Returns user" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.userService.findById(id);
    return this.userService.sanitizeUser(user);
  }

  @Get(":id/ratings")
  @ApiOperation({ summary: "Get user ratings" })
  @ApiResponse({ status: 200, description: "Returns user ratings" })
  async getUserRatings(@Param("id", ParseUUIDPipe) userId: string) {
    return this.userService.getUserRatings(userId);
  }
}
