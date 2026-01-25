import { Controller, Get } from '@nestjs/common';

@Controller('rating')
export class RatingController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
