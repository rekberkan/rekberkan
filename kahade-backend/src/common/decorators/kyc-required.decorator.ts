import { SetMetadata } from '@nestjs/common';

export const KycRequired = (...args: unknown[]) => SetMetadata('kyc_required', args);
