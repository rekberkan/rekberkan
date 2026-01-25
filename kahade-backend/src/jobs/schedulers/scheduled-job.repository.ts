import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class ScheduledJobRepository {
  constructor(private readonly prisma: PrismaService) {}
}
