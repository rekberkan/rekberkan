import { Controller, Get } from '@nestjs/common';

@Controller('promo')
export class PromoController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
