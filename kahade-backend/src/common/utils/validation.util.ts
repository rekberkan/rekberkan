// ============================================================================
// VALIDATION UTILITY
// Implements: Input Validation, Security Checks
// ============================================================================

export class ValidationUtil {
  static isEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  static isPhoneNumber(phone: string): boolean {
    if (!phone || typeof phone !== "string") return false;
    // Indonesian phone number format
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ""));
  }

  static isStrongPassword(password: string): boolean {
    if (!password || typeof password !== "string") return false;
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-{}\[\]:;"'<>,.?/|\\~`])[A-Za-z\d@$!%*?&#^()_+=\-{}\[\]:;"'<>,.?/|\\~`]{8,128}$/;
    return passwordRegex.test(password);
  }

  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    if (!password || password.length < 8) {
      errors.push("Password must be at least 8 characters");
    } else {
      score += 1;
    }

    if (password && password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    else errors.push("Must contain lowercase letter");
    if (/[A-Z]/.test(password)) score += 1;
    else errors.push("Must contain uppercase letter");
    if (/[0-9]/.test(password)) score += 1;
    else errors.push("Must contain number");
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else errors.push("Must contain special character");

    // Check for common patterns
    const commonPatterns = [
      /^123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
    ];
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push("Password is too common");
        score = Math.max(0, score - 2);
        break;
      }
    }

    return { isValid: errors.length === 0, errors, score: Math.min(5, score) };
  }

  static isUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static isUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== "string") return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isAlphanumeric(str: string): boolean {
    if (!str || typeof str !== "string") return false;
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  static sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") return "";
    return input
      .replace(/[<>"']/g, "")
      .replace(/\0/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();
  }

  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== "string") return "";
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  static isNIK(nik: string): boolean {
    if (!nik || typeof nik !== "string") return false;
    return /^[0-9]{16}$/.test(nik);
  }

  static isBankAccount(accountNumber: string): boolean {
    if (!accountNumber || typeof accountNumber !== "string") return false;
    const cleaned = accountNumber.replace(/\s/g, "");
    return /^[0-9]{8,20}$/.test(cleaned);
  }

  static validateAmount(
    amount: number,
    min: number,
    max: number,
  ): { isValid: boolean; error?: string } {
    if (typeof amount !== "number" || isNaN(amount)) {
      return { isValid: false, error: "Amount must be a valid number" };
    }
    if (amount < min)
      return { isValid: false, error: `Amount must be at least ${min}` };
    if (amount > max)
      return { isValid: false, error: `Amount must not exceed ${max}` };
    if (!Number.isInteger(amount))
      return { isValid: false, error: "Amount must be a whole number" };
    return { isValid: true };
  }

  static containsSqlInjection(input: string): boolean {
    if (!input || typeof input !== "string") return false;
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
      /('|"|;|--)/,
      /(\bOR\b|\bAND\b).*?=/i,
      /\b(EXEC|EXECUTE|xp_)\b/i,
    ];
    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  static containsXss(input: string): boolean {
    if (!input || typeof input !== "string") return false;
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ];
    return xssPatterns.some((pattern) => pattern.test(input));
  }
}
