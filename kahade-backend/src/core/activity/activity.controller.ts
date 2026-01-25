import { Controller, Get } from '@nestjs/common';

@Controller('activity')
export class ActivityController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
