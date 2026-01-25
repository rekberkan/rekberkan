import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('withdrawal')
@Controller('withdrawal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WithdrawalController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
