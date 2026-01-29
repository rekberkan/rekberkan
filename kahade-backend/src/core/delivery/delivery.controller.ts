import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { PrismaService } from "@infrastructure/database/prisma.service";
import { memoryStorage } from "multer";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { InitiatorRole, OrderStatus } from "@prisma/client";

// ============================================================================
// DELIVERY CONTROLLER - Production Ready
// Implements: Delivery Proof Upload, Tracking, Confirmation
// ============================================================================

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = process.env.UPLOAD_DEST || "./uploads";

interface SubmitDeliveryProofDto {
  orderId: string;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
}

@ApiTags("delivery")
@Controller("delivery")
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(private readonly prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    const deliveryDir = path.join(UPLOAD_DIR, "delivery");
    if (!fs.existsSync(deliveryDir)) {
      fs.mkdirSync(deliveryDir, { recursive: true });
    }
  }

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  health() {
    return { status: "ok" };
  }

  @Get("order/:orderId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get delivery proof for an order" })
  @ApiResponse({ status: 200, description: "Returns delivery proof info" })
  async getDeliveryProof(
    @CurrentUser("id") userId: string,
    @Param("orderId") orderId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify user is part of order
    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException("You are not part of this order");
    }

    const deliveryProof = await this.prisma.deliveryProof.findUnique({
      where: { orderId },
    });

    if (!deliveryProof) {
      return { deliveryProof: null };
    }

    return {
      deliveryProof: {
        id: deliveryProof.id,
        courier: deliveryProof.courier,
        trackingNumber: deliveryProof.trackingNumber,
        fileUrls: deliveryProof.fileUrls,
        notes: deliveryProof.notes,
        submittedAt: deliveryProof.submittedAt,
      },
    };
  }

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              "Invalid file type. Allowed: JPEG, PNG, WebP",
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: "Submit delivery proof" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        orderId: { type: "string" },
        courier: { type: "string" },
        trackingNumber: { type: "string" },
        notes: { type: "string" },
      },
      required: ["file", "orderId"],
    },
  })
  @ApiResponse({ status: 201, description: "Delivery proof submitted" })
  async submitDeliveryProof(
    @CurrentUser("id") userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SubmitDeliveryProofDto,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    // Get order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify user is the seller
    const sellerId =
      order.initiatorRole === "SELLER"
        ? order.initiatorId
        : order.counterpartyId;
    if (userId !== sellerId) {
      throw new ForbiddenException("Only the seller can submit delivery proof");
    }

    // Verify order status - PAID or ACCEPTED are valid
    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        "Order must be paid before submitting delivery proof",
      );
    }

    // Check if delivery proof already exists
    const existingProof = await this.prisma.deliveryProof.findUnique({
      where: { orderId: dto.orderId },
    });

    // Save file
    const deliveryDir = path.join(UPLOAD_DIR, "delivery", dto.orderId);
    if (!fs.existsSync(deliveryDir)) {
      fs.mkdirSync(deliveryDir, { recursive: true });
    }

    const fileHash = crypto
      .createHash("sha256")
      .update(file.buffer)
      .digest("hex");
    const fileExt = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}_${fileHash.substring(0, 8)}.${fileExt}`;
    const filePath = path.join(deliveryDir, fileName);
    const relativePath = `/uploads/delivery/${dto.orderId}/${fileName}`;

    fs.writeFileSync(filePath, file.buffer);

    let deliveryProof;

    if (existingProof) {
      // Update existing proof - add new file to array
      const existingUrls = existingProof.fileUrls as string[];
      const updatedUrls = [...existingUrls, relativePath];

      deliveryProof = await this.prisma.deliveryProof.update({
        where: { orderId: dto.orderId },
        data: {
          fileUrls: updatedUrls,
          courier: dto.courier || existingProof.courier,
          trackingNumber: dto.trackingNumber || existingProof.trackingNumber,
          notes: dto.notes || existingProof.notes,
        },
      });
    } else {
      // Create new delivery proof
      deliveryProof = await this.prisma.deliveryProof.create({
        data: {
          orderId: dto.orderId,
          courier: dto.courier,
          trackingNumber: dto.trackingNumber,
          fileUrls: [relativePath],
          notes: dto.notes || "",
        },
      });
    }

    this.logger.log(`Delivery proof submitted for order ${dto.orderId}`);

    return {
      message: "Delivery proof submitted successfully",
      deliveryProof: {
        id: deliveryProof.id,
        courier: deliveryProof.courier,
        trackingNumber: deliveryProof.trackingNumber,
        fileUrls: deliveryProof.fileUrls,
        submittedAt: deliveryProof.submittedAt,
      },
    };
  }

  @Patch(":orderId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update delivery proof info" })
  @ApiResponse({ status: 200, description: "Delivery proof updated" })
  async updateDeliveryProof(
    @CurrentUser("id") userId: string,
    @Param("orderId") orderId: string,
    @Body() dto: { courier?: string; trackingNumber?: string; notes?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify user is the seller
    const sellerId =
      order.initiatorRole === "SELLER"
        ? order.initiatorId
        : order.counterpartyId;
    if (userId !== sellerId) {
      throw new ForbiddenException("Only the seller can update delivery proof");
    }

    const deliveryProof = await this.prisma.deliveryProof.findUnique({
      where: { orderId },
    });

    if (!deliveryProof) {
      throw new NotFoundException("Delivery proof not found");
    }

    const updateData: any = {};
    if (dto.courier) updateData.courier = dto.courier;
    if (dto.trackingNumber) updateData.trackingNumber = dto.trackingNumber;
    if (dto.notes) updateData.notes = dto.notes;

    const updated = await this.prisma.deliveryProof.update({
      where: { orderId },
      data: updateData,
    });

    return {
      message: "Delivery proof updated successfully",
      deliveryProof: {
        id: updated.id,
        courier: updated.courier,
        trackingNumber: updated.trackingNumber,
        notes: updated.notes,
      },
    };
  }

  @Post(":orderId/confirm")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Confirm delivery received (buyer)" })
  @ApiResponse({ status: 200, description: "Delivery confirmed" })
  async confirmDelivery(
    @CurrentUser("id") userId: string,
    @Param("orderId") orderId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify user is the buyer
    const buyerId =
      order.initiatorRole === "BUYER"
        ? order.initiatorId
        : order.counterpartyId;
    if (userId !== buyerId) {
      throw new ForbiddenException("Only the buyer can confirm delivery");
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException("Order must be paid to confirm delivery");
    }

    // Check delivery proof exists
    const deliveryProof = await this.prisma.deliveryProof.findUnique({
      where: { orderId },
    });

    if (!deliveryProof) {
      throw new BadRequestException("No delivery proof submitted yet");
    }

    // Update order status to COMPLETED (triggers escrow release)
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });

    this.logger.log(
      `Delivery confirmed for order ${orderId} by buyer ${userId}`,
    );

    return {
      message: "Delivery confirmed successfully",
      status: "COMPLETED",
    };
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get my delivery proofs (as seller)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({ status: 200, description: "Returns user delivery proofs" })
  async getMyDeliveryProofs(
    @CurrentUser("id") userId: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Get orders where user is seller
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { initiatorId: userId, initiatorRole: InitiatorRole.SELLER },
          { counterpartyId: userId, initiatorRole: InitiatorRole.BUYER },
        ],
      },
      select: { id: true },
    });

    const orderIds = orders.map((o) => o.id);

    const [deliveryProofs, total] = await Promise.all([
      this.prisma.deliveryProof.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              title: true,
              amountMinor: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.deliveryProof.count({ where: { orderId: { in: orderIds } } }),
    ]);

    return {
      data: deliveryProofs.map((d) => ({
        id: d.id,
        order: d.order,
        courier: d.courier,
        trackingNumber: d.trackingNumber,
        fileCount: (d.fileUrls as string[]).length,
        submittedAt: d.submittedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get("pending")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get orders pending delivery (as buyer)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({
    status: 200,
    description: "Returns orders pending delivery confirmation",
  })
  async getPendingDeliveries(
    @CurrentUser("id") userId: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Get orders where user is buyer and status is PAID (awaiting delivery confirmation)
    const where = {
      OR: [
        { initiatorId: userId, initiatorRole: InitiatorRole.BUYER },
        { counterpartyId: userId, initiatorRole: InitiatorRole.SELLER },
      ],
      status: OrderStatus.PAID,
      deletedAt: null,
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          deliveryProof: true,
          initiator: { select: { id: true, username: true } },
          counterparty: { select: { id: true, username: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        title: o.title,
        amount: Number(o.amountMinor) / 100,
        seller:
          o.initiatorRole === "SELLER"
            ? o.initiator?.username
            : o.counterparty?.username,
        hasDeliveryProof: !!o.deliveryProof,
        deliveryProof: o.deliveryProof
          ? {
              courier: o.deliveryProof.courier,
              trackingNumber: o.deliveryProof.trackingNumber,
              submittedAt: o.deliveryProof.submittedAt,
            }
          : null,
        createdAt: o.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
