import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// REQUEST ID MIDDLEWARE
// ============================================================================
// Generates a unique request ID for each incoming request.
// This ID is used for:
// - Request tracing across services
// - Log correlation
// - Error tracking
// - Client-side debugging
// ============================================================================

// Extended Request interface with request ID
interface RequestWithId extends Request {
  id?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly REQUEST_ID_HEADER = "X-Request-ID";

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    // Use existing request ID from header if provided (for distributed tracing)
    // Otherwise, generate a new one
    const existingId = req.headers[
      this.REQUEST_ID_HEADER.toLowerCase()
    ] as string;
    const requestId = existingId || this.generateRequestId();

    // Attach to request object for use in handlers
    req.id = requestId;

    // Set response header for client-side correlation
    res.setHeader(this.REQUEST_ID_HEADER, requestId);

    next();
  }

  /**
   * Generate a unique request ID
   * Format: req_<timestamp>_<uuid>
   * This format allows for:
   * - Chronological sorting
   * - Uniqueness guarantee
   * - Easy identification as a request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const uuid = uuidv4().replace(/-/g, "").substring(0, 12);
    return `req_${timestamp}_${uuid}`;
  }
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================
// For use in non-middleware contexts (e.g., main.ts)
// ============================================================================

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const uuid = uuidv4().replace(/-/g, "").substring(0, 12);
  return `req_${timestamp}_${uuid}`;
}
