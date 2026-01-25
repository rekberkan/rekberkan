import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getInfo() {
    return {
      name: 'Kahade API',
      version: '1.0.0',
      description: 'P2P Escrow Platform Backend API',
      documentation: '/api/v1/docs',
    };
  }
}
