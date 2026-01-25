import { SetMetadata } from '@nestjs/common';

export const Cache = (...args: unknown[]) => SetMetadata('cache', args);
