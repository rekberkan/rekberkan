import * as crypto from 'crypto';

export class StringUtil {
  static generateRandomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  static generateNumericCode(length: number): string {
    let result = '';
    while (result.length < length) {
      const byte = crypto.randomBytes(1)[0];
      if (byte < 250) {
        result += (byte % 10).toString();
      }
    }
    return result;
  }

  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  static truncate(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + suffix;
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  static titleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username.substring(0, 2)}***${username.slice(-1)}@${domain}`;
  }

  static maskPhone(phone: string): string {
    if (phone.length <= 4) {
      return phone;
    }
    return `${phone.substring(0, 2)}****${phone.slice(-2)}`;
  }
}
