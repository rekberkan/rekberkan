import { Controller, Get } from '@nestjs/common';

@Controller('bank')
export class BankController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
