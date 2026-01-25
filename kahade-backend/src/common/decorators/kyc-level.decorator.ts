import { SetMetadata } from '@nestjs/common';

export const KycLevel = (...args: unknown[]) => SetMetadata('kyc_level', args);
