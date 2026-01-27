import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma, Promo, PromoAssignment } from '@prisma/client';

@Injectable()
export class PromoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PromoCreateInput): Promise<Promo> {
    return this.prisma.promo.create({ data });
  }

  async findById(id: string): Promise<Promo | null> {
    return this.prisma.promo.findUnique({ where: { id } });
  }

  async findByCode(code: string): Promise<Promo | null> {
    return this.prisma.promo.findUnique({ where: { code } });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PromoWhereInput;
    orderBy?: Prisma.PromoOrderByWithRelationInput;
  }): Promise<Promo[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.promo.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async count(where?: Prisma.PromoWhereInput): Promise<number> {
    return this.prisma.promo.count({ where });
  }

  async update(id: string, data: Prisma.PromoUpdateInput): Promise<Promo> {
    return this.prisma.promo.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Promo> {
    return this.prisma.promo.delete({ where: { id } });
  }

  async createAssignment(data: Prisma.PromoAssignmentCreateInput): Promise<PromoAssignment> {
    return this.prisma.promoAssignment.create({ data });
  }

  async findAssignment(promoId: string, userId: string): Promise<PromoAssignment | null> {
    return this.prisma.promoAssignment.findUnique({
      where: { promoId_userId: { promoId, userId } },
    });
  }

  async findAssignmentsByUser(userId: string): Promise<PromoAssignment[]> {
    return this.prisma.promoAssignment.findMany({
      where: { userId },
      include: { promo: true },
    });
  }

  async incrementUsage(id: string): Promise<Promo> {
    return this.prisma.promo.update({
      where: { id },
      data: { currentUsages: { increment: 1 } },
    });
  }
}
