import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('escrow')
@Controller('escrow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EscrowController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
