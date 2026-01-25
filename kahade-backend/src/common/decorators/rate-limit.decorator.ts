import { SetMetadata } from '@nestjs/common';

export const RateLimit = (...args: unknown[]) => SetMetadata('rate_limit', args);
