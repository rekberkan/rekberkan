import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123456';
  const testPassword = process.env.SEED_TEST_PASSWORD || 'test123456';
  
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedTestPassword = await bcrypt.hash(testPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kahade.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@kahade.com',
      passwordHash: hashedAdminPassword,
      isAdmin: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Created admin user:', admin);

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      username: 'buyer',
      email: 'buyer@test.com',
      passwordHash: hashedTestPassword,
      phone: '+6281234567890',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      username: 'seller',
      email: 'seller@test.com',
      passwordHash: hashedTestPassword,
      phone: '+6281234567891',
    },
  });

  console.log('Created test users:', { buyer, seller });

  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      initiatorId: buyer.id,
      initiatorRole: 'BUYER',
      title: 'iPhone 14 Pro Max',
      description: 'Brand new iPhone 14 Pro Max 256GB',
      category: 'ELECTRONICS',
      amountMinor: BigInt(1500000000),
      feePayer: 'BUYER',
      platformFeeMinor: BigInt(15000000),
      holdingPeriodDays: 7,
      status: 'PENDING_ACCEPT',
      inviteToken: Math.random().toString(36).substring(7),
      inviteExpiresAt: new Date(Date.now() + 86400000),
    },
  });

  console.log('Created sample order:', order);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
