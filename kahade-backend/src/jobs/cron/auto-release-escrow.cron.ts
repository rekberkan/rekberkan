import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EscrowService } from "@core/escrow/escrow.service";

// ============================================================================
// AUTO-RELEASE ESCROW CRON JOB
// Processes expired escrows and auto-releases funds to sellers
// ============================================================================

@Injectable()
export class AutoReleaseEscrowCron {
  private readonly logger = new Logger(AutoReleaseEscrowCron.name);
  private isRunning = false;

  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Run every 5 minutes to check for expired escrows
   * Escrows that have passed their timeoutAt date will be auto-released to seller
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredEscrows(): Promise<void> {
    // Prevent concurrent runs
    if (this.isRunning) {
      this.logger.warn("Auto-release escrow job already running, skipping...");
      return;
    }

    this.isRunning = true;
    this.logger.log("Starting auto-release escrow job...");

    try {
      const processedCount = await this.escrowService.processExpiredEscrows();

      if (processedCount > 0) {
        this.logger.log(`Auto-released ${processedCount} expired escrow(s)`);
      } else {
        this.logger.debug("No expired escrows to process");
      }
    } catch (error) {
      this.logger.error(
        `Auto-release escrow job failed: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for testing or admin use
   */
  async run(): Promise<{ processed: number }> {
    this.logger.log("Manual auto-release escrow job triggered");
    const processedCount = await this.escrowService.processExpiredEscrows();
    return { processed: processedCount };
  }
}
