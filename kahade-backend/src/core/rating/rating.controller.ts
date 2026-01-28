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
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma.service';

// ============================================================================
// RATING CONTROLLER - Production Ready
// Implements: Rating CRUD, Moderation, Statistics
// ============================================================================

interface CreateRatingDto {
  orderId: string;
  score: number;
  review?: string;
}

interface UpdateRatingDto {
  review?: string;
}

@ApiTags('rating')
@Controller('rating')
export class RatingController {
  private readonly logger = new Logger(RatingController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok' };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a rating for an order' })
  @ApiResponse({ status: 201, description: 'Rating created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or already rated' })
  async createRating(@CurrentUser('id') userId: string, @Body() dto: CreateRatingDto) {
    // Validate score
    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }

    // Get order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify user is part of the order
    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You are not part of this order');
    }

    // Verify order is completed
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rate completed orders');
    }

    // Determine who is being rated
    const toUserId = order.initiatorId === userId ? order.counterpartyId : order.initiatorId;

    if (!toUserId) {
      throw new BadRequestException('No counterparty to rate');
    }

    // Check if already rated
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        orderId: dto.orderId,
        fromUserId: userId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this order');
    }

    // Check for profanity in review (basic check)
    const containsProfanity = dto.review ? this.checkProfanity(dto.review) : false;

    // Create rating
    const rating = await this.prisma.rating.create({
      data: {
        orderId: dto.orderId,
        fromUserId: userId,
        toUserId,
        score: dto.score,
        review: dto.review?.trim(),
        containsProfanity,
        isModerated: containsProfanity,
      },
    });

    // Update user reputation score
    await this.updateUserReputation(toUserId);

    this.logger.log(`Rating created: ${rating.id} for order ${dto.orderId}`);

    return {
      message: 'Rating submitted successfully',
      rating: {
        id: rating.id,
        score: rating.score,
        review: rating.review,
        createdAt: rating.createdAt,
      },
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get ratings for a user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Returns user ratings' })
  async getUserRatings(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [ratings, total, stats] = await Promise.all([
      this.prisma.rating.findMany({
        where: {
          toUserId: userId,
          isHidden: false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          fromUser: {
            select: { id: true, username: true },
          },
          order: {
            select: { orderNumber: true, title: true },
          },
        },
      }),
      this.prisma.rating.count({
        where: { toUserId: userId, isHidden: false },
      }),
      this.prisma.rating.aggregate({
        where: { toUserId: userId, isHidden: false },
        _avg: { score: true },
        _count: true,
      }),
    ]);

    return {
      data: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        review: r.containsProfanity ? '[Review hidden due to policy violation]' : r.review,
        fromUser: r.fromUser,
        order: r.order,
        createdAt: r.createdAt,
      })),
      stats: {
        averageScore: stats._avg.score ? Number(stats._avg.score.toFixed(2)) : 0,
        totalRatings: stats._count,
      },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ratings for an order' })
  @ApiResponse({ status: 200, description: 'Returns order ratings' })
  async getOrderRatings(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify user is part of the order
    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You are not part of this order');
    }

    const ratings = await this.prisma.rating.findMany({
      where: { orderId },
      include: {
        fromUser: { select: { id: true, username: true } },
        toUser: { select: { id: true, username: true } },
      },
    });

    return {
      ratings: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        review: r.containsProfanity ? '[Review hidden due to policy violation]' : r.review,
        fromUser: r.fromUser,
        toUser: r.toUser,
        createdAt: r.createdAt,
      })),
      canRate: !ratings.some((r) => r.fromUserId === userId),
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ratings received by current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyRatings(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.getUserRatings(userId, page, limit);
  }

  @Get('given')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ratings given by current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGivenRatings(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { fromUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          toUser: { select: { id: true, username: true } },
          order: { select: { orderNumber: true, title: true } },
        },
      }),
      this.prisma.rating.count({ where: { fromUserId: userId } }),
    ]);

    return {
      data: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        review: r.review,
        toUser: r.toUser,
        order: r.order,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update rating review (within 24 hours)' })
  @ApiResponse({ status: 200, description: 'Rating updated successfully' })
  async updateRating(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRatingDto,
  ) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.fromUserId !== userId) {
      throw new ForbiddenException('You can only update your own ratings');
    }

    // Check if within 24 hours
    const hoursSinceCreation = (Date.now() - rating.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new BadRequestException('Ratings can only be updated within 24 hours');
    }

    const containsProfanity = dto.review ? this.checkProfanity(dto.review) : false;

    const updated = await this.prisma.rating.update({
      where: { id },
      data: {
        review: dto.review?.trim(),
        containsProfanity,
        isModerated: containsProfanity,
      },
    });

    return {
      message: 'Rating updated successfully',
      rating: {
        id: updated.id,
        score: updated.score,
        review: updated.review,
      },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete rating (within 1 hour)' })
  @ApiResponse({ status: 200, description: 'Rating deleted successfully' })
  async deleteRating(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.fromUserId !== userId) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    // Check if within 1 hour
    const hoursSinceCreation = (Date.now() - rating.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 1) {
      throw new BadRequestException('Ratings can only be deleted within 1 hour');
    }

    await this.prisma.rating.delete({ where: { id } });

    // Update user reputation
    await this.updateUserReputation(rating.toUserId);

    this.logger.log(`Rating ${id} deleted by user ${userId}`);

    return { message: 'Rating deleted successfully' };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private checkProfanity(text: string): boolean {
    const profanityList = [
      'fuck',
      'shit',
      'damn',
      'ass',
      'bitch',
      'bastard',
      'crap',
      'piss',
      'dick',
      'cock',
      'pussy',
      'slut',
      'whore',
      'nigger',
      'faggot',
      'retard',
      // Indonesian profanity
      'anjing',
      'bangsat',
      'babi',
      'kontol',
      'memek',
      'ngentot',
      'tolol',
      'goblok',
      'bodoh',
      'idiot',
      'bajingan',
      'keparat',
      'setan',
      'iblis',
    ];

    const lowerText = text.toLowerCase();
    return profanityList.some((word) => lowerText.includes(word));
  }

  private async updateUserReputation(userId: string): Promise<void> {
    const stats = await this.prisma.rating.aggregate({
      where: { toUserId: userId, isHidden: false },
      _avg: { score: true },
      _count: true,
    });

    const reputationScore = stats._avg.score ? Number(stats._avg.score.toFixed(2)) : 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore,
        totalTransactions: stats._count,
      },
    });
  }
}
