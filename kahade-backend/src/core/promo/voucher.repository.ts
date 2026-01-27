import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma, Voucher, VoucherUsage, VoucherStatus } from '@prisma/client';

@Injectable()
export class VoucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VoucherCreateInput): Promise<Voucher> {
    return this.prisma.voucher.create({ data });
  }

  async findById(id: string): Promise<Voucher | null> {
    return this.prisma.voucher.findUnique({ where: { id } });
  }

  async findByCode(code: string): Promise<Voucher | null> {
    return this.prisma.voucher.findUnique({ where: { code } });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.VoucherWhereInput;
    orderBy?: Prisma.VoucherOrderByWithRelationInput;
  }): Promise<Voucher[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.voucher.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async count(where?: Prisma.VoucherWhereInput): Promise<number> {
    return this.prisma.voucher.count({ where });
  }

  async update(id: string, data: Prisma.VoucherUpdateInput): Promise<Voucher> {
    return this.prisma.voucher.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Voucher> {
    return this.prisma.voucher.delete({ where: { id } });
  }

  async findActiveVouchersForUser(userId: string): Promise<Voucher[]> {
    const now = new Date();
    return this.prisma.voucher.findMany({
      where: {
        status: VoucherStatus.ACTIVE,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { assignedToUserId: userId },
          { assignedToUserId: null },
        ],
      },
      orderBy: { validUntil: 'asc' },
    });
  }

  async createUsage(data: Prisma.VoucherUsageCreateInput): Promise<VoucherUsage> {
    return this.prisma.voucherUsage.create({ data });
  }

  async findUsageByIdempotencyKey(idempotencyKey: string): Promise<VoucherUsage | null> {
    return this.prisma.voucherUsage.findUnique({
      where: { idempotencyKey },
    });
  }

  async countUserUsages(voucherId: string, userId: string): Promise<number> {
    return this.prisma.voucherUsage.count({
      where: { voucherId, userId },
    });
  }

  async findUsagesByUser(userId: string, skip?: number, take?: number): Promise<VoucherUsage[]> {
    return this.prisma.voucherUsage.findMany({
      where: { userId },
      include: { voucher: true },
      orderBy: { usedAt: 'desc' },
      skip,
      take,
    });
  }

  async countUsagesByUser(userId: string): Promise<number> {
    return this.prisma.voucherUsage.count({ where: { userId } });
  }

  async incrementUsage(id: string): Promise<Voucher> {
    return this.prisma.voucher.update({
      where: { id },
      data: { currentUsages: { increment: 1 } },
    });
  }

  async deactivate(id: string): Promise<Voucher> {
    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.INACTIVE },
    });
  }
}
