import { Controller, Get } from '@nestjs/common';

@Controller('delivery')
export class DeliveryController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
