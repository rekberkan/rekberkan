import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";

/**
 * Pagination Pipe - Validates and sanitizes pagination parameters
 * Prevents DoS attacks through unlimited record requests
 */

export interface PaginationConfig {
  maxLimit?: number;
  defaultLimit?: number;
  defaultPage?: number;
}

const DEFAULT_CONFIG: PaginationConfig = {
  maxLimit: 100,
  defaultLimit: 20,
  defaultPage: 1,
};

@Injectable()
export class ParseLimitPipe implements PipeTransform<string, number> {
  private readonly maxLimit: number;
  private readonly defaultLimit: number;

  constructor(config?: PaginationConfig) {
    this.maxLimit = config?.maxLimit ?? DEFAULT_CONFIG.maxLimit!;
    this.defaultLimit = config?.defaultLimit ?? DEFAULT_CONFIG.defaultLimit!;
  }

  transform(value: string, _metadata: ArgumentMetadata): number {
    if (!value) {
      return this.defaultLimit;
    }

    const limit = parseInt(value, 10);

    if (isNaN(limit) || limit < 1) {
      return this.defaultLimit;
    }

    if (limit > this.maxLimit) {
      return this.maxLimit;
    }

    return limit;
  }
}

@Injectable()
export class ParsePagePipe implements PipeTransform<string, number> {
  private readonly defaultPage: number;

  constructor(config?: PaginationConfig) {
    this.defaultPage = config?.defaultPage ?? DEFAULT_CONFIG.defaultPage!;
  }

  transform(value: string, _metadata: ArgumentMetadata): number {
    if (!value) {
      return this.defaultPage;
    }

    const page = parseInt(value, 10);

    if (isNaN(page) || page < 1) {
      return this.defaultPage;
    }

    return page;
  }
}

/**
 * Utility function to validate and sanitize pagination parameters
 * Can be used directly in controller methods
 */
export function sanitizePagination(
  page?: number | string,
  limit?: number | string,
  config?: PaginationConfig,
): { page: number; limit: number; skip: number } {
  const maxLimit = config?.maxLimit ?? DEFAULT_CONFIG.maxLimit!;
  const defaultLimit = config?.defaultLimit ?? DEFAULT_CONFIG.defaultLimit!;
  const defaultPage = config?.defaultPage ?? DEFAULT_CONFIG.defaultPage!;

  let sanitizedPage =
    typeof page === "string" ? parseInt(page, 10) : (page ?? defaultPage);
  let sanitizedLimit =
    typeof limit === "string" ? parseInt(limit, 10) : (limit ?? defaultLimit);

  if (isNaN(sanitizedPage) || sanitizedPage < 1) {
    sanitizedPage = defaultPage;
  }

  if (isNaN(sanitizedLimit) || sanitizedLimit < 1) {
    sanitizedLimit = defaultLimit;
  }

  if (sanitizedLimit > maxLimit) {
    sanitizedLimit = maxLimit;
  }

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip: (sanitizedPage - 1) * sanitizedLimit,
  };
}
