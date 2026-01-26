import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadKycDto } from './dto/upload-kyc.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Express } from 'express';
import { memoryStorage } from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.userService.findById(userId);
    return this.userService.sanitizeUser(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updateUserDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Post('kyc')
  @ApiOperation({ summary: 'Upload KYC documents' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'KYC documents uploaded' })
  @UseInterceptors(FileInterceptor('document', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, callback) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, PDF'), false);
      }
      callback(null, true);
    },
  }))
  async uploadKYC(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadKycDto,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, PDF');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
    return this.userService.uploadKYCDocument(userId, file, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Avatar file size must not exceed 5MB');
    }

    return this.userService.updateAvatar(userId, file);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Returns user statistics' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.userService.getStats(userId);
  }

  @Patch('notification-settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated' })
  async updateNotificationSettings(
    @CurrentUser('id') userId: string,
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

  @Get(':id/ratings')
  @ApiOperation({ summary: 'Get user ratings' })
  @ApiResponse({ status: 200, description: 'Returns user ratings' })
  async getUserRatings(@Param('id') userId: string) {
    return this.userService.getUserRatings(userId);
  }
}

// Separate controller for /users routes
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return this.userService.sanitizeUser(user);
  }

  @Get(':id/ratings')
  @ApiOperation({ summary: 'Get user ratings' })
  @ApiResponse({ status: 200, description: 'Returns user ratings' })
  async getUserRatings(@Param('id') userId: string) {
    return this.userService.getUserRatings(userId);
  }
}
