import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { LeadsService } from '../../src/modules/leads/leads.service.js';
import { DISTRIBUTION_QUEUE_NAME } from '../../src/providers/queue/distribution-queue.constants.js';

const testDatabaseUrl = process.env.DATABASE_URL_TEST ?? 'postgresql://elevate:elevate@localhost:5432/elevate_lead_dispatcher_test?schema=public';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.REDIS_URL = process.env.REDIS_URL_TEST ?? 'redis://localhost:6379/1';
process.env.JWT_ACCESS_SECRET = 'e2e-test-secret-with-at-least-thirty-two-characters';

const prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const distributionQueue = new Queue(DISTRIBUTION_QUEUE_NAME, { connection: redis });
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
  let leadsService: LeadsService;

  beforeAll(async () => {
    await distributionQueue.obliterate({ force: true });
    const { AppModule } = await import('../../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    leadsService = app.get(LeadsService);
  });

  beforeEach(async () => {
    await prisma.distribution.deleteMany();
    await prisma.distributionJob.deleteMany();
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

    const callCenterSeeds = [
      { name: 'Call Center A', code: 'CALL-CENTER-A', weight: 50 },
      { name: 'Call Center B', code: 'CALL-CENTER-B', weight: 30 },
      { name: 'Call Center C', code: 'CALL-CENTER-C', weight: 20 },
    ];
    await prisma.callCenterDispatchConfig.deleteMany();
    for (const callCenterSeed of callCenterSeeds) {
      const callCenter = await prisma.callCenter.upsert({
        where: { code: callCenterSeed.code },
        update: { name: callCenterSeed.name, isActive: true },
        create: { name: callCenterSeed.name, code: callCenterSeed.code, isActive: true },
      });
      await prisma.callCenterDispatchConfig.create({
        data: { callCenterId: callCenter.id, weight: callCenterSeed.weight },
      });
    }
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
    await waitFor(() => prisma.distribution.count({ where: { leadId: response.body.leadId } }), 1);
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
    await waitFor(() => prisma.distributionJob.count({ where: { leadId: first.body.leadId } }), 1);
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

  it('creates one lead and one distribution job for concurrent idempotent retries', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => leadsService.create(validLead, 'lead-concurrent-retry-001')),
    );

    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(new Set(results.map((result) => result.leadId)).size).toBe(1);
    await expect(prisma.lead.count()).resolves.toBe(1);
    await expect(prisma.distributionJob.count()).resolves.toBe(1);
  });

  it('rejects missing idempotency keys and unavailable catalog references', async () => {
    await request(app.getHttpServer()).post('/api/leads').send(validLead).expect(400);
    await request(app.getHttpServer())
      .post('/api/leads')
      .set('Idempotency-Key', 'lead-invalid-catalog-001')
      .send({ ...validLead, productCode: 'unknown-product' })
      .expect(422);
  });

  it('distributes 100 concurrent leads with the configured proportion', async () => {
    await Promise.all(
      Array.from({ length: 100 }, (_, index) =>
        leadsService.create(
          {
            ...validLead,
            name: `Lead ${index}`,
            email: `lead-${index}@example.com`,
            phone: `+5511999${String(index).padStart(5, '0')}`,
          },
          `lead-concurrent-${index}`,
        ),
      ),
    );

    await waitFor(() => prisma.distribution.count(), 100, 20_000);
    const groupedDistributions = await prisma.distribution.groupBy({
      by: ['callCenterId'],
      _count: { _all: true },
    });
    const callCenters = await prisma.callCenter.findMany({ select: { id: true, code: true } });
    const distributionCounts = Object.fromEntries(
      groupedDistributions.map((distribution) => [
        callCenters.find((callCenter) => callCenter.id === distribution.callCenterId)?.code,
        distribution._count._all,
      ]),
    );

    expect(await prisma.distributionJob.count({ where: { status: 'COMPLETED' } })).toBe(100);
    expect(distributionCounts).toEqual({ 'CALL-CENTER-A': 50, 'CALL-CENTER-B': 30, 'CALL-CENTER-C': 20 });
  });

  afterEach(async () => {
    await waitFor(() => prisma.distributionJob.count({ where: { status: { not: 'COMPLETED' } } }), 0, 20_000);
  });

  afterAll(async () => {
    await app.close();
    await distributionQueue.close();
    await redis.quit();
    await prisma.$disconnect();
  });
});

async function waitFor(query: () => Promise<number>, expected: number, timeout = 5_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if ((await query()) === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Expected ${expected} records before timeout.`);
}
