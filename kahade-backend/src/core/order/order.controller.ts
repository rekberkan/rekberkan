import { Controller, Get } from '@nestjs/common';

@Controller('order')
export class OrderController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
