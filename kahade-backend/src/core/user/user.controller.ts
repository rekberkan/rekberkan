import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';

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
  @UseInterceptors(FileInterceptor('document'))
  async uploadKYC(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: { documentType: string },
  ) {
    return this.userService.uploadKYCDocument(userId, file, dto.documentType);
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
