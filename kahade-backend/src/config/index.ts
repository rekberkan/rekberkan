// ============================================================================
// CONFIGURATION EXPORTS
// ============================================================================
// Central export point for all configuration modules
// ============================================================================

export { default as appConfig } from "./app.config";
export { default as databaseConfig, buildDatabaseUrl } from "./database.config";
export {
  default as loggerConfig,
  createWinstonTransports,
} from "./logger.config";
export { default as securityConfig } from "./security.config";
export { default as uploadConfig, validateFile } from "./upload.config";
export { default as platformConfig } from "./platform.config";
export { validate, validateProductionConfig } from "./config.validation";

// Re-export all configs as array for ConfigModule.forRoot
import appConfig from "./app.config";
import databaseConfig from "./database.config";
import loggerConfig from "./logger.config";
import securityConfig from "./security.config";
import uploadConfig from "./upload.config";
import platformConfig from "./platform.config";

export const configs = [
  appConfig,
  databaseConfig,
  loggerConfig,
  securityConfig,
  uploadConfig,
  platformConfig,
];
