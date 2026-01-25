import { SetMetadata } from '@nestjs/common';

export const Transaction = (...args: unknown[]) => SetMetadata('transaction', args);
