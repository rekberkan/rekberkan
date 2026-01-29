import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { ConfigService } from "@nestjs/config";

// ============================================================================
// BANK-GRADE PRISMA SERVICE
// Implements: Connection Pooling, Health Checks, Graceful Shutdown
// ============================================================================

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor(private readonly configService?: ConfigService) {
    const isProduction = process.env.NODE_ENV === "production";

    super({
      log: isProduction
        ? [{ emit: "event", level: "error" }]
        : [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "info" },
            { emit: "event", level: "warn" },
          ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Set up query logging in development
    if (!isProduction) {
      (this as any).$on("query", (e: Prisma.QueryEvent) => {
        if (e.duration > 1000) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    // Log errors
    (this as any).$on("error", (e: Prisma.LogEvent) => {
      this.logger.error(`Database error: ${e.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log("Database connected successfully");
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.isConnected = false;
    this.logger.log("Database disconnected");
  }

  /**
   * Health check for database connection
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Execute with retry logic for transient failures
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 100,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable (connection issues, deadlocks)
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        this.logger.warn(
          `Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`,
        );

        await this.delay(delayMs * Math.pow(2, attempt - 1));
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P1001: Can't reach database server
      // P1002: Database server timed out
      // P2024: Timed out fetching connection from pool
      // P2034: Transaction failed due to write conflict or deadlock
      const retryableCodes = ["P1001", "P1002", "P2024", "P2034"];
      return retryableCodes.includes(error.code);
    }
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean database (development/testing only)
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot clean database in production");
    }

    const models = Object.keys(this).filter(
      (key) => !key.startsWith("_") && !key.startsWith("$") && key !== "logger",
    );

    await Promise.all(
      models.map(async (modelKey) => {
        const model = (this as Record<string, unknown>)[modelKey];
        if (
          model &&
          typeof (model as { deleteMany?: () => Promise<unknown> })
            .deleteMany === "function"
        ) {
          await (model as { deleteMany: () => Promise<unknown> }).deleteMany();
        }
      }),
    );
  }
}
