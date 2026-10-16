import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';

const testDatabaseUrl = process.env.DATABASE_URL_TEST ?? 'postgresql://elevate:elevate@localhost:5432/elevate_lead_dispatcher_test?schema=public';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.JWT_ACCESS_SECRET = 'e2e-test-secret-with-at-least-thirty-two-characters';

const prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
const validLead = {
  name: 'João Silva',
  email: 'joao@email.com',
  phone: '+5511999999999',
  productCode: 'nutralean',
  funnelCode: 'vsl-01',
  affiliateCode: 'affiliate-999',
  source: 'facebook',
  campaign: 'campaign-123',
  utm: { source: 'facebook', medium: 'cpc', campaign: 'campaign-123', content: 'ad-01' },
};

describe('API e2e', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const { AppModule } = await import('../../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  beforeEach(async () => {
    await prisma.leadStatusHistory.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.funnelProduct.deleteMany();
    await prisma.affiliate.deleteMany();
    await prisma.product.deleteMany();
    await prisma.funnel.deleteMany();

    const funnel = await prisma.funnel.create({ data: { name: 'VSL 01', code: 'vsl-01' } });
    const product = await prisma.product.create({ data: { name: 'NutraLean', code: 'nutralean' } });
    await prisma.funnelProduct.create({ data: { funnelId: funnel.id, productId: product.id } });
    await prisma.affiliate.create({ data: { name: 'Affiliate 999', code: 'affiliate-999' } });
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'elevate-lead-dispatcher-api' });
  });

  it('creates a lead and its initial status event', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-create-001')
      .send(validLead)
      .expect(201);

    expect(response.body).toEqual({ success: true, leadId: expect.any(String) });
    await expect(prisma.lead.findUnique({
      where: { id: response.body.leadId },
      include: { statusHistory: true },
    })).resolves.toMatchObject({
      status: 'NEW',
      statusHistory: [{ status: 'NEW', eventSource: 'SYSTEM' }],
    });
  });

  it('returns the original lead for an idempotent retry', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-retry-001')
      .send(validLead)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-retry-001')
      .send({ ...validLead, name: '  João   Silva  ' })
      .expect(200)
      .expect({ success: true, leadId: first.body.leadId });

    await expect(prisma.lead.count()).resolves.toBe(1);
  });

  it('rejects reuse of an idempotency key with a different payload', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-conflict-001')
      .send(validLead)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-conflict-001')
      .send({ ...validLead, campaign: 'another-campaign' })
      .expect(409);
  });

  it('rejects missing idempotency keys and unavailable catalog references', async () => {
    await request(app.getHttpServer()).post('/api/leads').send(validLead).expect(400);
    await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-invalid-catalog-001')
      .send({ ...validLead, productCode: 'unknown-product' })
      .expect(422);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
});
