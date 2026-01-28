import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PromoService, CreatePromoDto, CreateVoucherDto } from './promo.service';
import { VoucherStatus } from '@prisma/client';

// ============================================================================
// PROMO & VOUCHER CONTROLLER - Production Ready
// ============================================================================

@ApiTags('promo')
@Controller()
export class PromoController {
  private readonly logger = new Logger(PromoController.name);

  constructor(private readonly promoService: PromoService) {}

  // ============================================================================
  // ADMIN ENDPOINTS - Promo Management
  // ============================================================================

  @Post('admin/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new promo (Admin)' })
  async createPromo(@Body() dto: CreatePromoDto) {
    return this.promoService.createPromo(dto);
  }

  @Get('admin/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all promos (Admin)' })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listPromos(
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.promoService.listPromos({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get promo details (Admin)' })
  async getPromo(@Param('id') id: string) {
    return this.promoService.getPromo(id);
  }

  @Patch('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update promo (Admin)' })
  async updatePromo(@Param('id') id: string, @Body() dto: Partial<CreatePromoDto>) {
    return this.promoService.updatePromo(id, dto);
  }

  @Delete('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate promo (Admin)' })
  async deactivatePromo(@Param('id') id: string) {
    return this.promoService.deactivatePromo(id);
  }

  @Post('admin/promos/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign promo to user (Admin)' })
  async assignPromoToUser(@Param('id') promoId: string, @Body('userId') userId: string) {
    return this.promoService.assignPromoToUser(promoId, userId);
  }

  // ============================================================================
  // ADMIN ENDPOINTS - Voucher Management
  // ============================================================================

  @Post('admin/vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new voucher (Admin)' })
  async createVoucher(@Body() dto: CreateVoucherDto) {
    return this.promoService.createVoucher(dto);
  }

  @Get('admin/vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all vouchers (Admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listVouchersAdmin(
    @Query('status') status?: VoucherStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.promoService.listVouchers({
      status,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('admin/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get voucher details (Admin)' })
  async getVoucher(@Param('id') id: string) {
    return this.promoService.getVoucher(id);
  }

  @Delete('admin/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate voucher (Admin)' })
  async deactivateVoucher(@Param('id') id: string) {
    return this.promoService.deactivateVoucher(id);
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  @Get('vouchers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get available vouchers for current user' })
  async getAvailableVouchers(@CurrentUser('id') userId: string) {
    return this.promoService.getAvailableVouchersForUser(userId);
  }

  @Get('vouchers/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user voucher usage history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getVoucherHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.promoService.getUserVoucherHistory(userId, page || 1, limit || 20);
  }

  @Post('vouchers/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate voucher code' })
  async validateVoucher(
    @CurrentUser('id') userId: string,
    @Body() dto: { code: string; amountMinor: number; category?: string },
  ) {
    const result = await this.promoService.validateVoucher(
      dto.code,
      userId,
      BigInt(dto.amountMinor),
      dto.category,
    );

    if (!result.valid) {
      return { valid: false, error: result.error };
    }

    // Calculate discount preview
    const voucher = result.voucher;
    let discountMinor: bigint;
    const orderAmountMinor = BigInt(dto.amountMinor);

    if (voucher.voucherType === 'PERCENTAGE') {
      const percent = voucher.discountPercent || 0;
      discountMinor = (orderAmountMinor * BigInt(Math.round(percent * 100))) / 10000n;
      if (voucher.maxDiscountMinor && discountMinor > voucher.maxDiscountMinor) {
        discountMinor = voucher.maxDiscountMinor;
      }
    } else {
      discountMinor = voucher.discountMinor || 0n;
    }

    if (discountMinor > orderAmountMinor) {
      discountMinor = orderAmountMinor;
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        voucherType: voucher.voucherType,
        discountPercent: voucher.discountPercent,
        discountMinor: voucher.discountMinor?.toString(),
        maxDiscountMinor: voucher.maxDiscountMinor?.toString(),
      },
      preview: {
        originalMinor: dto.amountMinor.toString(),
        discountMinor: discountMinor.toString(),
        finalMinor: (orderAmountMinor - discountMinor).toString(),
      },
    };
  }

  @Post('vouchers/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Apply voucher to order' })
  async applyVoucher(
    @CurrentUser('id') userId: string,
    @Body() dto: { code: string; amountMinor: number; orderId?: string; idempotencyKey?: string },
  ) {
    const result = await this.promoService.applyVoucher(
      dto.code,
      userId,
      BigInt(dto.amountMinor),
      dto.orderId,
      dto.idempotencyKey,
    );

    return {
      voucherId: result.voucherId,
      code: result.code,
      originalMinor: result.originalMinor.toString(),
      discountMinor: result.discountMinor.toString(),
      finalMinor: result.finalMinor.toString(),
    };
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get('promo/health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', module: 'promo' };
  }
}
