// ============================================================================
// INPUT SANITIZATION UTILITY
// ============================================================================
// Fix #60: Sanitize user input to prevent XSS and injection attacks
// ============================================================================

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") {
    return str;
  }

  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== "string") {
    return str;
  }

  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize string for safe display
 * - Strips HTML tags
 * - Escapes remaining special characters
 * - Trims whitespace
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== "string") {
    return str;
  }

  return escapeHtml(stripHtml(str.trim()));
}

/**
 * Sanitize email address
 * - Lowercase
 * - Trim whitespace
 * - Basic validation
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return email;
  }

  return email.toLowerCase().trim();
}

/**
 * Sanitize phone number
 * - Remove non-numeric characters except +
 * - Normalize format
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // Keep only digits and leading +
  let sanitized = phone.replace(/[^\d+]/g, "");

  // Ensure + is only at the start
  if (sanitized.includes("+")) {
    sanitized = "+" + sanitized.replace(/\+/g, "");
  }

  return sanitized;
}

/**
 * Sanitize username
 * - Lowercase
 * - Remove special characters except underscore
 * - Trim whitespace
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== "string") {
    return username;
  }

  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Sanitize URL
 * - Validate protocol
 * - Remove javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }

  // Ensure valid protocol
  if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
    return "https://" + trimmed;
  }

  return trimmed;
}

/**
 * Sanitize filename
 * - Remove path traversal characters
 * - Remove special characters
 * - Limit length
 */
export function sanitizeFilename(filename: string, maxLength = 255): string {
  if (!filename || typeof filename !== "string") {
    return "unnamed";
  }

  // Remove path traversal
  let sanitized = filename.replace(/\.\./g, "");

  // Remove directory separators
  sanitized = sanitized.replace(/[/\\]/g, "");

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Keep only safe characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  if (sanitized.length > maxLength) {
    const ext = sanitized.split(".").pop() || "";
    const name = sanitized.substring(0, maxLength - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized || "unnamed";
}

/**
 * Sanitize search query
 * - Remove SQL injection patterns
 * - Escape special characters
 * - Limit length
 */
export function sanitizeSearchQuery(query: string, maxLength = 100): string {
  if (!query || typeof query !== "string") {
    return "";
  }

  let sanitized = query.trim();

  // Remove SQL injection patterns
  const sqlPatterns = [
    /--/g,
    /;/g,
    /'/g,
    /"/g,
    /\\/g,
    /\/\*/g,
    /\*\//g,
    /xp_/gi,
    /exec/gi,
    /execute/gi,
    /insert/gi,
    /update/gi,
    /delete/gi,
    /drop/gi,
    /union/gi,
    /select/gi,
  ];

  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize object recursively
 * - Sanitize all string values
 * - Preserve object structure
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const result: Record<string, any> = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : sanitizeObject(item),
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validate and sanitize JSON string
 */
export function sanitizeJson(jsonString: string): any {
  if (!jsonString || typeof jsonString !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}
