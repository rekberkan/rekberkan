import { Controller, Get } from '@nestjs/common';

@Controller('payment')
export class PaymentController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
