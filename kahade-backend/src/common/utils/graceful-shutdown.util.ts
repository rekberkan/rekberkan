import { INestApplication, Logger } from "@nestjs/common";

// ============================================================================
// GRACEFUL SHUTDOWN UTILITY
// ============================================================================
// Fix #73: Properly handle application shutdown to prevent data loss
// ============================================================================

const logger = new Logger("GracefulShutdown");

/**
 * Shutdown state tracking
 */
let isShuttingDown = false;
let shutdownPromise: Promise<void> | null = null;

/**
 * Registered cleanup handlers
 */
const cleanupHandlers: Array<{
  name: string;
  handler: () => Promise<void>;
  priority: number;
}> = [];

/**
 * Register a cleanup handler to be called during shutdown
 * @param name Handler name for logging
 * @param handler Async cleanup function
 * @param priority Lower numbers run first (default: 100)
 */
export function registerCleanupHandler(
  name: string,
  handler: () => Promise<void>,
  priority = 100,
): void {
  cleanupHandlers.push({ name, handler, priority });
  cleanupHandlers.sort((a, b) => a.priority - b.priority);
  logger.debug(`Registered cleanup handler: ${name} (priority: ${priority})`);
}

/**
 * Check if application is shutting down
 */
export function isApplicationShuttingDown(): boolean {
  return isShuttingDown;
}

/**
 * Setup graceful shutdown handlers for the application
 * @param app NestJS application instance
 * @param options Shutdown options
 */
export function setupGracefulShutdown(
  app: INestApplication,
  options: {
    timeout?: number; // Shutdown timeout in ms (default: 30s)
    beforeShutdown?: () => Promise<void>;
    afterShutdown?: () => Promise<void>;
  } = {},
): void {
  const { timeout = 30000, beforeShutdown, afterShutdown } = options;

  // Enable shutdown hooks
  app.enableShutdownHooks();

  /**
   * Main shutdown handler
   */
  const shutdown = async (signal: string): Promise<void> => {
    // Prevent multiple shutdown attempts
    if (isShuttingDown) {
      logger.warn(`Shutdown already in progress, ignoring ${signal}`);
      return shutdownPromise || Promise.resolve();
    }

    isShuttingDown = true;
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    shutdownPromise = (async () => {
      const startTime = Date.now();

      try {
        // Run before shutdown hook
        if (beforeShutdown) {
          logger.debug("Running beforeShutdown hook...");
          await beforeShutdown();
        }

        // Stop accepting new connections
        logger.debug("Stopping HTTP server...");

        // Run registered cleanup handlers
        for (const { name, handler } of cleanupHandlers) {
          try {
            logger.debug(`Running cleanup handler: ${name}`);
            await Promise.race([
              handler(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Cleanup timeout")), 10000),
              ),
            ]);
            logger.debug(`Cleanup handler completed: ${name}`);
          } catch (error) {
            logger.error(`Cleanup handler failed: ${name}`, error);
          }
        }

        // Close the NestJS application
        logger.debug("Closing NestJS application...");
        await app.close();

        // Run after shutdown hook
        if (afterShutdown) {
          logger.debug("Running afterShutdown hook...");
          await afterShutdown();
        }

        const duration = Date.now() - startTime;
        logger.log(`Graceful shutdown completed in ${duration}ms`);
      } catch (error) {
        logger.error("Error during graceful shutdown:", error);
        throw error;
      }
    })();

    // Force exit if shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      logger.error(`Shutdown timeout (${timeout}ms) exceeded, forcing exit`);
      process.exit(1);
    }, timeout);

    try {
      await shutdownPromise;
      clearTimeout(forceExitTimeout);
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      logger.error("Shutdown failed:", error);
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGHUP", () => shutdown("SIGHUP"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    shutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection at:", promise, "reason:", reason);
    // Don't shutdown on unhandled rejection, just log
  });

  logger.log("Graceful shutdown handlers registered");
}

/**
 * Create cleanup handler for database connections
 */
export function createDatabaseCleanupHandler(prisma: {
  $disconnect: () => Promise<void>;
}): () => Promise<void> {
  return async () => {
    logger.debug("Disconnecting from database...");
    await prisma.$disconnect();
    logger.debug("Database disconnected");
  };
}

/**
 * Create cleanup handler for Redis connections
 */
export function createRedisCleanupHandler(redis: {
  quit: () => Promise<any>;
}): () => Promise<void> {
  return async () => {
    logger.debug("Closing Redis connection...");
    await redis.quit();
    logger.debug("Redis connection closed");
  };
}

/**
 * Create cleanup handler for Bull queues
 */
export function createQueueCleanupHandler(
  queues: Array<{ close: () => Promise<void>; name: string }>,
): () => Promise<void> {
  return async () => {
    logger.debug(`Closing ${queues.length} queue(s)...`);
    await Promise.all(
      queues.map(async (queue) => {
        try {
          await queue.close();
          logger.debug(`Queue ${queue.name} closed`);
        } catch (error) {
          logger.error(`Failed to close queue ${queue.name}:`, error);
        }
      }),
    );
    logger.debug("All queues closed");
  };
}
