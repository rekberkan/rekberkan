import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  DisputeService,
  CreateDisputeDto as ServiceCreateDisputeDto,
  ResolveDisputeDto as ServiceResolveDisputeDto,
} from "./dispute.service";
import { CreateDisputeDto } from "./dto/create-dispute.dto";
import { ResolveDisputeDto } from "./dto/resolve-dispute.dto";
import { SubmitEvidenceDto } from "./dto/submit-evidence.dto";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { RolesGuard } from "@common/guards/roles.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Roles } from "@common/decorators/roles.decorator";

// ============================================================================
// DISPUTE CONTROLLER - Bank-Grade Security
// Implements: Rate Limiting, Input Validation, Role-Based Access
// ============================================================================

@ApiTags("disputes")
@Controller("disputes")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 disputes per hour max
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create new dispute" })
  @ApiResponse({ status: 201, description: "Dispute created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async create(
    @CurrentUser("id") userId: string,
    @Body() createDisputeDto: CreateDisputeDto,
  ) {
    const dto: ServiceCreateDisputeDto = {
      orderId: createDisputeDto.orderId,
      reason: createDisputeDto.reason,
    };
    return this.disputeService.create(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get all disputes (Admin only)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Returns paginated disputes" })
  async findAll(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    // Validate pagination
    const validPage = page < 1 ? 1 : page;
    const validLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;
    return this.disputeService.findAll({ page: validPage, limit: validLimit });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get dispute by ID" })
  @ApiResponse({ status: 200, description: "Returns dispute" })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  async findOne(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.disputeService.findOne(id, userId);
  }

  @Post(":id/respond")
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 responses per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Respond to dispute (counterparty)" })
  @ApiResponse({ status: 200, description: "Dispute responded" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async respond(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("response") response: string,
  ) {
    if (!response || typeof response !== "string") {
      throw new BadRequestException("Response is required");
    }
    const trimmedResponse = response.trim();
    if (trimmedResponse.length < 5) {
      throw new BadRequestException("Response must be at least 5 characters");
    }
    if (trimmedResponse.length > 2000) {
      throw new BadRequestException("Response must not exceed 2000 characters");
    }
    return this.disputeService.respond(id, userId, trimmedResponse);
  }

  @Post(":id/evidence")
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 evidence submissions per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit dispute evidence" })
  @ApiResponse({ status: 200, description: "Evidence submitted" })
  @ApiResponse({ status: 400, description: "Invalid evidence data" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async submitEvidence(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() submitEvidenceDto: SubmitEvidenceDto,
  ) {
    // Validation is handled by class-validator decorators in SubmitEvidenceDto
    const fileUrls = submitEvidenceDto.fileUrl
      ? [submitEvidenceDto.fileUrl]
      : [];

    // Include evidence type in description for audit trail
    const enhancedDescription = `[${submitEvidenceDto.type}] ${submitEvidenceDto.description}`;

    await this.disputeService.submitEvidence(
      id,
      userId,
      fileUrls,
      enhancedDescription,
    );
    return {
      message: "Evidence submitted successfully",
      type: submitEvidenceDto.type,
    };
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "Get dispute messages" })
  @ApiResponse({ status: 200, description: "Returns dispute messages" })
  async getMessages(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.disputeService.getMessages(id, userId);
  }

  @Post(":id/messages")
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 messages per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add dispute message" })
  @ApiResponse({ status: 201, description: "Message sent" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async addMessage(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("message") message: string,
  ) {
    if (!message || typeof message !== "string") {
      throw new BadRequestException("Message is required");
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      throw new BadRequestException("Message cannot be empty");
    }
    if (trimmedMessage.length > 1000) {
      throw new BadRequestException("Message must not exceed 1000 characters");
    }
    return this.disputeService.addMessage(id, userId, trimmedMessage);
  }

  @Put(":id/resolve")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Throttle({ default: { limit: 30, ttl: 3600000 } }) // 30 resolutions per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resolve dispute (Admin only)" })
  @ApiResponse({ status: 200, description: "Dispute resolved successfully" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async resolve(
    @Param("id") id: string,
    @CurrentUser("id") adminId: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
  ) {
    const dto: ServiceResolveDisputeDto = {
      decision: resolveDisputeDto.decision,
      sellerAmountMinor: resolveDisputeDto.sellerAmountMinor,
      buyerRefundMinor: resolveDisputeDto.buyerRefundMinor,
      resolutionNotes: resolveDisputeDto.resolutionNotes,
    };
    return this.disputeService.resolve(id, adminId, dto);
  }
}
