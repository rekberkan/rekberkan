import { registerAs } from '@nestjs/config';

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================
// Configures Winston logger with daily rotation and proper retention
// ============================================================================

export default registerAs('logger', () => ({
  // Log level based on environment
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Log file paths
  logFile: process.env.LOG_FILE || 'logs/application.log',
  errorLogFile: process.env.ERROR_LOG_FILE || 'logs/error.log',

  // Log rotation settings
  rotation: {
    // Maximum size of each log file before rotation
    maxSize: process.env.LOG_MAX_SIZE || '20m', // 20 MB

    // Maximum number of days to keep log files
    maxDays: parseInt(process.env.LOG_MAX_DAYS || '14', 10), // 14 days

    // Maximum number of files to keep
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14', 10), // 14 files

    // Date pattern for rotated files
    datePattern: 'YYYY-MM-DD',

    // Compress rotated files
    compress: process.env.LOG_COMPRESS !== 'false', // true by default

    // Frequency of rotation
    frequency: process.env.LOG_FREQUENCY || 'daily', // daily, hourly, etc.
  },

  // Console output settings
  console: {
    enabled: process.env.LOG_CONSOLE !== 'false', // true by default
    colorize: process.env.NODE_ENV !== 'production',
  },

  // JSON format for production (easier to parse by log aggregators)
  json: process.env.NODE_ENV === 'production',

  // Include timestamp in logs
  timestamp: true,

  // Sensitive data patterns to mask in logs
  maskPatterns: [
    // Passwords
    { pattern: /password["\s:=]+["']?[^"'\s,}]+/gi, replacement: 'password=[REDACTED]' },
    // API keys
    { pattern: /(api[_-]?key|apikey)["\s:=]+["']?[^"'\s,}]+/gi, replacement: '$1=[REDACTED]' },
    // Tokens
    { pattern: /(token|bearer)["\s:=]+["']?[^"'\s,}]+/gi, replacement: '$1=[REDACTED]' },
    // Credit cards
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' },
    // Email addresses (optional - may want to keep for debugging)
    // { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  ],
}));

// ============================================================================
// WINSTON TRANSPORT FACTORY
// ============================================================================
// Creates Winston transports based on configuration
// ============================================================================

import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export function createWinstonTransports(
  config: ReturnType<typeof import('./logger.config').default>,
) {
  const transports: winston.transport[] = [];

  // Console transport
  if (config.console?.enabled) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          config.console.colorize ? winston.format.colorize() : winston.format.uncolorize(),
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          }),
        ),
      }),
    );
  }

  // File transport with rotation
  if (config.logFile) {
    transports.push(
      new DailyRotateFile({
        filename: config.logFile.replace('.log', '-%DATE%.log'),
        datePattern: config.rotation.datePattern,
        maxSize: config.rotation.maxSize,
        maxFiles: `${config.rotation.maxDays}d`,
        zippedArchive: config.rotation.compress,
        format: winston.format.combine(
          winston.format.timestamp(),
          config.json ? winston.format.json() : winston.format.simple(),
        ),
      }),
    );
  }

  // Error file transport
  if (config.errorLogFile) {
    transports.push(
      new DailyRotateFile({
        filename: config.errorLogFile.replace('.log', '-%DATE%.log'),
        datePattern: config.rotation.datePattern,
        maxSize: config.rotation.maxSize,
        maxFiles: `${config.rotation.maxDays}d`,
        zippedArchive: config.rotation.compress,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          config.json ? winston.format.json() : winston.format.simple(),
        ),
      }),
    );
  }

  return transports;
}
