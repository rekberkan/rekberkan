import { Controller, Get } from '@nestjs/common';

@Controller('referral')
export class ReferralController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
