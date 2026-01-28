import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

// ============================================================================
// ORDER INTEGRATION TESTS
// ============================================================================
// Fix #85: Integration tests for order flow
// ============================================================================

describe('Order Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let buyerToken: string;
  let sellerToken: string;
  // User IDs stored for potential future use in extended tests
  let _buyerId: string;
  let _sellerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test users
    const buyerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `buyer_${Date.now()}@test.com`,
        username: `buyer_${Date.now()}`,
        phone: '+6281234567890',
        password: 'TestP@ssw0rd!',
      });

    buyerToken = buyerResponse.body.accessToken;
    _buyerId = buyerResponse.body.user.id;

    const sellerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `seller_${Date.now()}@test.com`,
        username: `seller_${Date.now()}`,
        phone: '+6281234567891',
        password: 'TestP@ssw0rd!',
      });

    sellerToken = sellerResponse.body.accessToken;
    _sellerId = sellerResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$executeRaw`DELETE FROM users WHERE email LIKE '%@test.com'`;
    await app.close();
  });

  describe('Order Creation', () => {
    it('should create an order as seller', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product',
          description: 'Test description',
          category: 'ELECTRONICS',
          amountMinor: 1000000,
          currency: 'IDR',
          initiatorRole: 'SELLER',
          feePayer: 'BUYER',
          holdingPeriodDays: 7,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body.status).toBe('WAITING_COUNTERPARTY');
      expect(response.body.inviteToken).toBeDefined();
    });

    it('should reject order without authentication', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          title: 'Test Product',
          amountMinor: 1000000,
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test',
        })
        .expect(400);

      expect(response.body.message).toContain('amountMinor');
    });
  });

  describe('Order Acceptance', () => {
    let orderId: string;
    let inviteToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product for Acceptance',
          description: 'Test description',
          category: 'ELECTRONICS',
          amountMinor: 1000000,
          currency: 'IDR',
          initiatorRole: 'SELLER',
          feePayer: 'BUYER',
          holdingPeriodDays: 7,
        });

      orderId = response.body.id;
      inviteToken = response.body.inviteToken;
    });

    it('should allow buyer to accept order with invite token', async () => {
      const response = await request(app.getHttpServer())
        .post(`/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ inviteToken })
        .expect(200);

      expect(response.body.status).toBe('PENDING_ACCEPT');
    });

    it('should reject acceptance with invalid invite token', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ inviteToken: 'invalid-token' })
        .expect(400);
    });

    it('should prevent seller from accepting own order', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ inviteToken })
        .expect(403);
    });
  });

  describe('Order Cancellation', () => {
    let orderId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product for Cancellation',
          description: 'Test description',
          category: 'ELECTRONICS',
          amountMinor: 1000000,
          currency: 'IDR',
          initiatorRole: 'SELLER',
          feePayer: 'BUYER',
          holdingPeriodDays: 7,
        });

      orderId = response.body.id;
    });

    it('should allow initiator to cancel pending order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });

    it('should prevent non-participant from cancelling', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Not my order' })
        .expect(403);
    });
  });

  describe('Order Listing', () => {
    it('should list user orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders?status=WAITING_COUNTERPARTY')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      response.body.data.forEach((order: any) => {
        expect(order.status).toBe('WAITING_COUNTERPARTY');
      });
    });
  });
});
