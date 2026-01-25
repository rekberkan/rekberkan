import { SetMetadata } from '@nestjs/common';

export const AuditLog = (...args: unknown[]) => SetMetadata('audit_log', args);
