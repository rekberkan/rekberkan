import { Controller, Get, Version } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

/**
 * Application Controller
 *
 * QUALITY FIX [M012]: Added comprehensive health check endpoints
 */
@ApiTags("info")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Version("1")
  @Get()
  @ApiOperation({ summary: "API information" })
  @ApiResponse({ status: 200, description: "Returns API information" })
  getInfo() {
    return this.appService.getInfo();
  }

  @Get("health")
  @ApiOperation({ summary: "Basic health check" })
  @ApiResponse({ status: 200, description: "Returns basic health status" })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get("health/detailed")
  @ApiOperation({ summary: "Detailed health check with dependency status" })
  @ApiResponse({
    status: 200,
    description: "Returns detailed health status including database and memory",
  })
  async getDetailedHealth() {
    return this.appService.getDetailedHealth();
  }

  @Get("health/ready")
  @ApiOperation({ summary: "Readiness probe for container orchestration" })
  @ApiResponse({ status: 200, description: "Returns readiness status" })
  async getReadiness() {
    return this.appService.getReadiness();
  }

  @Get("health/live")
  @ApiOperation({ summary: "Liveness probe for container orchestration" })
  @ApiResponse({ status: 200, description: "Returns liveness status" })
  getLiveness() {
    return this.appService.getLiveness();
  }
}
