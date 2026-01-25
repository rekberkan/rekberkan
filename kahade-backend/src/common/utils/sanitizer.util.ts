// ============================================================================
// INPUT SANITIZER UTILITY
// Implements: XSS Prevention, SQL Injection Prevention, Input Cleaning
// ============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Remove potentially dangerous characters from input
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  return email.toLowerCase().trim();
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Keep only digits and plus sign
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize numeric string (for IDs, account numbers, etc.)
 */
export function sanitizeNumericString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input.replace(/\D/g, '');
}

/**
 * Sanitize alphanumeric string
 */
export function sanitizeAlphanumeric(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Sanitize username
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';
  
  // Allow letters, numbers, underscores
  return username.toLowerCase().replace(/[^a-z0-9_]/g, '').trim();
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Truncate string to maximum length
 */
export function truncate(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') return '';
  
  if (input.length <= maxLength) return input;
  
  return input.substring(0, maxLength);
}
