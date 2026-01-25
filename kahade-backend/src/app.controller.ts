import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('info')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'API information' })
  @ApiResponse({ status: 200, description: 'Returns API information' })
  getInfo() {
    return this.appService.getInfo();
  }
}
