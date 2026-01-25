import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class JournalRepository {
  constructor(private readonly prisma: PrismaService) {}
}
