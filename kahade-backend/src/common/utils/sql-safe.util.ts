import { Prisma } from '@prisma/client';

// ============================================================================
// SQL INJECTION PREVENTION UTILITIES
// ============================================================================
// Fix #61: Safe SQL query building utilities
// ============================================================================

/**
 * Escape a string value for safe use in SQL
 * Note: Always prefer parameterized queries over escaping
 */
export function escapeString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '\\"')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Validate and sanitize an identifier (table name, column name)
 * Only allows alphanumeric characters and underscores
 */
export function sanitizeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Invalid identifier');
  }

  // Only allow alphanumeric and underscore
  const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');

  if (sanitized !== identifier) {
    throw new Error(`Invalid characters in identifier: ${identifier}`);
  }

  // Prevent SQL keywords as identifiers
  const sqlKeywords = [
    'select',
    'insert',
    'update',
    'delete',
    'drop',
    'create',
    'alter',
    'truncate',
    'grant',
    'revoke',
    'union',
    'where',
    'from',
    'join',
    'exec',
    'execute',
    'xp_',
    'sp_',
  ];

  if (sqlKeywords.includes(sanitized.toLowerCase())) {
    throw new Error(`SQL keyword not allowed as identifier: ${identifier}`);
  }

  return sanitized;
}

/**
 * Build a safe LIKE pattern
 * Escapes special LIKE characters (%, _)
 */
export function safeLikePattern(
  value: string,
  position: 'start' | 'end' | 'contains' = 'contains',
): string {
  if (!value || typeof value !== 'string') {
    return '%';
  }

  // Escape LIKE special characters
  const escaped = value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

  switch (position) {
    case 'start':
      return `${escaped}%`;
    case 'end':
      return `%${escaped}`;
    case 'contains':
    default:
      return `%${escaped}%`;
  }
}

/**
 * Build a safe ORDER BY clause
 * Only allows whitelisted columns and directions
 */
export function safeOrderBy(
  column: string,
  direction: string,
  allowedColumns: string[],
): { column: string; direction: 'asc' | 'desc' } {
  // Validate column
  const sanitizedColumn = sanitizeIdentifier(column);

  if (!allowedColumns.includes(sanitizedColumn)) {
    throw new Error(`Column not allowed for ordering: ${column}`);
  }

  // Validate direction
  const normalizedDirection = direction.toLowerCase();
  if (normalizedDirection !== 'asc' && normalizedDirection !== 'desc') {
    throw new Error(`Invalid order direction: ${direction}`);
  }

  return {
    column: sanitizedColumn,
    direction: normalizedDirection as 'asc' | 'desc',
  };
}

/**
 * Build a safe IN clause with parameterized values
 * Returns a Prisma.sql template for use with $queryRaw
 */
export function safeInClause(values: (string | number)[]): Prisma.Sql {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('IN clause requires at least one value');
  }

  // Validate all values are strings or numbers
  for (const value of values) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error('IN clause values must be strings or numbers');
    }
  }

  // Build parameterized IN clause
  const placeholders = values.map(() => '?').join(', ');
  return Prisma.sql`(${Prisma.join(values)})`;
}

/**
 * Build a safe raw query with parameterized values
 * Use this instead of string concatenation
 */
export function safeRawQuery(template: TemplateStringsArray, ...values: any[]): Prisma.Sql {
  return Prisma.sql(template, ...values);
}

/**
 * Validate pagination parameters
 */
export function safePagination(
  page: number | string,
  limit: number | string,
  maxLimit = 100,
): { skip: number; take: number } {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error('Invalid page number');
  }

  if (isNaN(limitNum) || limitNum < 1) {
    throw new Error('Invalid limit');
  }

  const safeTake = Math.min(limitNum, maxLimit);
  const safeSkip = (pageNum - 1) * safeTake;

  return { skip: safeSkip, take: safeTake };
}

/**
 * Build a safe WHERE clause for search
 * Uses parameterized queries
 */
export function safeSearchWhere(
  searchTerm: string,
  searchFields: string[],
  allowedFields: string[],
): Prisma.Sql {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return Prisma.sql`TRUE`;
  }

  // Validate search fields
  const validFields = searchFields.filter((f) => {
    const sanitized = sanitizeIdentifier(f);
    return allowedFields.includes(sanitized);
  });

  if (validFields.length === 0) {
    return Prisma.sql`TRUE`;
  }

  const pattern = safeLikePattern(searchTerm);
  const conditions = validFields.map((field) => Prisma.sql`${Prisma.raw(field)} ILIKE ${pattern}`);

  return Prisma.sql`(${Prisma.join(conditions, ' OR ')})`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUUID(value: string): string {
  if (!isValidUUID(value)) {
    throw new Error('Invalid UUID format');
  }
  return value.toLowerCase();
}
