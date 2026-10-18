import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { LeadsService } from '../../src/modules/leads/leads.service.js';
import { DISTRIBUTION_QUEUE_NAME } from '../../src/providers/queue/distribution-queue.constants.js';
import { hashWebhookApiKey } from '../../src/common/webhooks/utils/hash-webhook-api-key.js';

const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ??
  'postgresql://elevate:elevate@localhost:5432/elevate_lead_dispatcher_test?schema=public';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.REDIS_URL =
  process.env.REDIS_URL_TEST ?? 'redis://localhost:6379/1';
process.env.JWT_ACCESS_SECRET =
  'e2e-test-secret-with-at-least-thirty-two-characters';

const prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const distributionQueue = new Queue(DISTRIBUTION_QUEUE_NAME, {
  connection: redis,
});
const webhookApiKeys = new Map<string, string>();
const validLead = {
  name: 'João Silva',
  email: 'joao@email.com',
  phone: '+5511999999999',
  productCode: 'nutralean',
  funnelCode: 'vsl-01',
  affiliateCode: 'affiliate-999',
  source: 'facebook',
  campaign: 'campaign-123',
  utm: {
    source: 'facebook',
    medium: 'cpc',
    campaign: 'campaign-123',
    content: 'ad-01',
  },
};

describe('API e2e', () => {
  let app: INestApplication<App>;
  let leadsService: LeadsService;
  let jwtService: JwtService;

  beforeAll(async () => {
    await distributionQueue.obliterate({ force: true });
    const { AppModule } = await import('../../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    leadsService = app.get(LeadsService);
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await prisma.callCenterWebhookEvent.deleteMany();
    await prisma.callCenterWebhookCredential.deleteMany();
    await prisma.distribution.deleteMany();
    await prisma.distributionJob.deleteMany();
    await prisma.leadStatusHistory.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.funnelProduct.deleteMany();
    await prisma.affiliate.deleteMany();
    await prisma.product.deleteMany();
    await prisma.funnel.deleteMany();

    const funnel = await prisma.funnel.create({
      data: { name: 'VSL 01', code: 'vsl-01' },
    });
    const product = await prisma.product.create({
      data: { name: 'NutraLean', code: 'nutralean' },
    });
    await prisma.funnelProduct.create({
      data: { funnelId: funnel.id, productId: product.id },
    });
    await prisma.affiliate.create({
      data: { name: 'Affiliate 999', code: 'affiliate-999' },
    });

    const callCenterSeeds = [
      { name: 'Call Center A', code: 'CALL-CENTER-A', weight: 50 },
      { name: 'Call Center B', code: 'CALL-CENTER-B', weight: 30 },
      { name: 'Call Center C', code: 'CALL-CENTER-C', weight: 20 },
    ];
    webhookApiKeys.clear();
    await prisma.callCenterDispatchConfig.deleteMany();
    for (const callCenterSeed of callCenterSeeds) {
      const callCenter = await prisma.callCenter.upsert({
        where: { code: callCenterSeed.code },
        update: { name: callCenterSeed.name, isActive: true },
        create: {
          name: callCenterSeed.name,
          code: callCenterSeed.code,
          isActive: true,
        },
      });
      await prisma.callCenterDispatchConfig.create({
        data: { callCenterId: callCenter.id, weight: callCenterSeed.weight },
      });
      const apiKey = `e2e-webhook-api-key-${callCenterSeed.code}`;
      await prisma.callCenterWebhookCredential.create({
        data: {
          callCenterId: callCenter.id,
          keyHash: hashWebhookApiKey(apiKey),
        },
      });
      webhookApiKeys.set(callCenter.code, apiKey);
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

    expect(response.body).toEqual({
      success: true,
      leadId: expect.any(String),
    });
    await expect(
      prisma.lead.findUnique({
        where: { id: response.body.leadId },
        include: { statusHistory: true },
      }),
    ).resolves.toMatchObject({
      status: 'NEW',
      statusHistory: [{ status: 'NEW', eventSource: 'SYSTEM' }],
    });
    await waitFor(
      () =>
        prisma.distribution.count({ where: { leadId: response.body.leadId } }),
      1,
    );
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
    await waitFor(
      () =>
        prisma.distributionJob.count({ where: { leadId: first.body.leadId } }),
      1,
    );
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
      Array.from({ length: 10 }, () =>
        leadsService.create(validLead, 'lead-concurrent-retry-001'),
      ),
    );

    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(new Set(results.map((result) => result.leadId)).size).toBe(1);
    await expect(prisma.lead.count()).resolves.toBe(1);
    await expect(prisma.distributionJob.count()).resolves.toBe(1);
  });

  it('rejects missing idempotency keys and unavailable catalog references', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .send(validLead)
      .expect(400);
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
    const callCenters = await prisma.callCenter.findMany({
      select: { id: true, code: true },
    });
    const distributionCounts = Object.fromEntries(
      groupedDistributions.map((distribution) => [
        callCenters.find(
          (callCenter) => callCenter.id === distribution.callCenterId,
        )?.code,
        distribution._count._all,
      ]),
    );

    expect(
      await prisma.distributionJob.count({ where: { status: 'COMPLETED' } }),
    ).toBe(100);
    expect(distributionCounts).toEqual({
      'CALL-CENTER-A': 50,
      'CALL-CENTER-B': 30,
      'CALL-CENTER-C': 20,
    });
  });

  it('enforces lead query scopes and persists manual status history', async () => {
    const centers = await prisma.callCenter.findMany({
      orderBy: { code: 'asc' },
    });
    const [centerA, centerB] = centers;
    const admin = await prisma.user.upsert({
      where: { email: 'lead-query-admin@example.com' },
      update: { role: UserRole.ADMIN, callCenterId: null, isActive: true },
      create: {
        name: 'Lead Query Admin',
        email: 'lead-query-admin@example.com',
        passwordHash: 'test',
        role: UserRole.ADMIN,
      },
    });
    const operator = await prisma.user.upsert({
      where: { email: 'lead-query-operator@example.com' },
      update: {
        role: UserRole.OPERATOR,
        callCenterId: centerA.id,
        isActive: true,
      },
      create: {
        name: 'Lead Query Operator',
        email: 'lead-query-operator@example.com',
        passwordHash: 'test',
        role: UserRole.OPERATOR,
        callCenterId: centerA.id,
      },
    });
    const adminToken = jwtService.sign({ sub: admin.id });
    const operatorToken = jwtService.sign({ sub: operator.id });

    const leadA = await leadsService.create(
      { ...validLead, name: 'Scoped A', email: 'scoped-a@example.com' },
      'lead-scope-a',
    );
    const leadB = await leadsService.create(
      { ...validLead, name: 'Scoped B', email: 'scoped-b@example.com' },
      'lead-scope-b',
    );
    await waitFor(() => prisma.distribution.count(), 2);
    await prisma.distribution.update({
      where: { leadId: leadA.leadId },
      data: { callCenterId: centerA.id },
    });
    await prisma.distribution.update({
      where: { leadId: leadB.leadId },
      data: { callCenterId: centerB.id },
    });

    await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.content).toHaveLength(2);
        expect(response.body.content[0]).not.toHaveProperty('idempotencyKey');
        expect(response.body.content[0]).not.toHaveProperty('requestHash');
      });
    await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.content).toHaveLength(1);
        expect(response.body.content[0].id).toBe(leadA.leadId);
      });
    const firstPage = await request(app.getHttpServer())
      .get('/api/leads?pageNumber=0&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(firstPage.body.content).toHaveLength(1);
    expect(firstPage.body).toMatchObject({
      pageNumber: 0,
      pageSize: 1,
      totalElements: 2,
      totalPages: 2,
    });
    const secondPage = await request(app.getHttpServer())
      .get('/api/leads?pageNumber=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(secondPage.body.content).toHaveLength(1);
    expect(secondPage.body.content[0].id).not.toBe(
      firstPage.body.content[0].id,
    );
    await request(app.getHttpServer())
      .get(
        '/api/leads?status=NEW&productCode=nutralean&funnelCode=vsl-01&source=facebook&callCenterCode=CALL-CENTER-A',
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((response) =>
        expect(
          response.body.content.map((item: { id: string }) => item.id),
        ).toEqual([leadA.leadId]),
      );
    await request(app.getHttpServer())
      .get('/api/leads?callCenterCode=CALL-CENTER-B')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200)
      .expect((response) => expect(response.body.content).toEqual([]));
    await request(app.getHttpServer())
      .get(`/api/leads/${leadB.leadId}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadA.leadId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'CONTACTED' })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          leadId: leadA.leadId,
          status: 'CONTACTED',
          changed: true,
        });
        expect(response.body.updatedAt).toEqual(expect.any(String));
      });
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadA.leadId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'CONTACTED' })
      .expect(200)
      .expect((response) => expect(response.body.changed).toBe(false));
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadA.leadId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'NEW' })
      .expect(422);
    await expect(
      prisma.leadStatusHistory.count({ where: { leadId: leadA.leadId } }),
    ).resolves.toBe(2);
    await prisma.callCenter.update({
      where: { id: centerA.id },
      data: { isActive: false },
    });
    await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);
  });

  it('processes, deduplicates, orders and audits call center webhook events', async () => {
    const createdLead = await leadsService.create(
      { ...validLead, name: 'Webhook Lead', email: 'webhook@example.com' },
      'lead-webhook-001',
    );
    await waitFor(
      () =>
        prisma.distribution.count({ where: { leadId: createdLead.leadId } }),
      1,
    );
    const distribution = await prisma.distribution.findUniqueOrThrow({
      where: { leadId: createdLead.leadId },
      include: { callCenter: true },
    });
    const initialHistory = await prisma.leadStatusHistory.findFirstOrThrow({
      where: { leadId: createdLead.leadId },
      orderBy: { occurredAt: 'desc' },
    });
    const eventTimestamp = new Date(
      initialHistory.occurredAt.getTime() + 60_000,
    ).toISOString();
    const event = {
      lead_id: createdLead.leadId,
      external_id: 'call-center-event-001',
      status: 'contacted',
      timestamp: eventTimestamp,
    };
    const assignedCallCenterApiKey = webhookApiKeys.get(
      distribution.callCenter.code,
    )!;
    const endpoint = request(app.getHttpServer()).post(
      '/api/webhooks/callcenter',
    );

    await endpoint.send(event).expect(401);
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({ ...event, call_center_code: 'CALL-CENTER-A' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({
        ...event,
        external_id: 'call-center-event-future',
        timestamp: new Date(Date.now() + 6 * 60_000).toISOString(),
      })
      .expect(422);

    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send(event)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          success: true,
          leadId: createdLead.leadId,
          status: 'CONTACTED',
          outcome: 'APPLIED',
        });
      });
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send(event)
      .expect(200)
      .expect((response) => expect(response.body.outcome).toBe('APPLIED'));
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({ ...event, status: 'callback' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({
        ...event,
        external_id: 'call-center-event-stale',
        status: 'no_answer',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'CONTACTED',
          outcome: 'IGNORED_STALE',
        });
      });
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({
        ...event,
        external_id: 'call-center-event-unchanged',
        timestamp: new Date(
          new Date(eventTimestamp).getTime() + 60_000,
        ).toISOString(),
      })
      .expect(200)
      .expect((response) =>
        expect(response.body.outcome).toBe('IGNORED_UNCHANGED'),
      );
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({
        ...event,
        external_id: 'call-center-event-invalid',
        status: 'new',
        timestamp: new Date(
          new Date(eventTimestamp).getTime() + 120_000,
        ).toISOString(),
      })
      .expect(422);

    const otherCallCenter = await prisma.callCenter.findFirstOrThrow({
      where: { id: { not: distribution.callCenterId } },
    });
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', webhookApiKeys.get(otherCallCenter.code)!)
      .send({
        ...event,
        external_id: 'call-center-event-out-of-scope',
      })
      .expect(404);

    await expect(
      prisma.leadStatusHistory.count({ where: { leadId: createdLead.leadId } }),
    ).resolves.toBe(2);
    await expect(
      prisma.callCenterWebhookEvent.count({
        where: { leadId: createdLead.leadId },
      }),
    ).resolves.toBe(4);

    const concurrentEvent = {
      ...event,
      external_id: 'call-center-event-concurrent',
      status: 'callback',
      timestamp: new Date(
        new Date(eventTimestamp).getTime() + 180_000,
      ).toISOString(),
    };
    const concurrentResponses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/api/webhooks/callcenter')
          .set('X-API-Key', assignedCallCenterApiKey)
          .send(concurrentEvent),
      ),
    );
    expect(
      concurrentResponses.every((response) => response.status === 200),
    ).toBe(true);
    await expect(
      prisma.leadStatusHistory.count({ where: { leadId: createdLead.leadId } }),
    ).resolves.toBe(3);
    await expect(
      prisma.callCenterWebhookEvent.count({
        where: { leadId: createdLead.leadId },
      }),
    ).resolves.toBe(5);

    const raceLead = await leadsService.create(
      {
        ...validLead,
        name: 'Webhook Race Lead',
        email: 'webhook-race@example.com',
      },
      'lead-webhook-race-001',
    );
    await waitFor(
      () => prisma.distribution.count({ where: { leadId: raceLead.leadId } }),
      1,
    );
    const raceDistribution = await prisma.distribution.findUniqueOrThrow({
      where: { leadId: raceLead.leadId },
      include: { callCenter: true },
    });
    const raceInitialHistory = await prisma.leadStatusHistory.findFirstOrThrow({
      where: { leadId: raceLead.leadId },
      orderBy: { occurredAt: 'desc' },
    });
    const adminUser = {
      id: 'race-admin',
      name: 'Race Admin',
      email: 'race-admin@example.com',
      role: UserRole.ADMIN,
      callCenterId: null,
    };
    const webhookRace = request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', webhookApiKeys.get(raceDistribution.callCenter.code)!)
      .send({
        lead_id: raceLead.leadId,
        external_id: 'call-center-event-manual-race',
        status: 'contacted',
        timestamp: new Date(
          raceInitialHistory.occurredAt.getTime() + 60_000,
        ).toISOString(),
      });
    const [manualResult, webhookResult] = await Promise.all([
      leadsService.updateStatus(adminUser, raceLead.leadId, {
        status: 'CONTACTED',
      }),
      webhookRace,
    ]);
    expect(manualResult.status).toBe('CONTACTED');
    expect(webhookResult.status).toBe(200);
    await expect(
      prisma.leadStatusHistory.count({ where: { leadId: raceLead.leadId } }),
    ).resolves.toBe(2);
    await expect(
      prisma.callCenterWebhookEvent.count({
        where: { leadId: raceLead.leadId },
      }),
    ).resolves.toBe(1);

    const credential =
      await prisma.callCenterWebhookCredential.findFirstOrThrow({
        where: { callCenterId: distribution.callCenterId },
      });
    await prisma.callCenterWebhookCredential.update({
      where: { id: credential.id },
      data: { isActive: false, revokedAt: new Date() },
    });
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({ ...event, external_id: 'call-center-event-revoked' })
      .expect(401);
    await prisma.callCenterWebhookCredential.update({
      where: { id: credential.id },
      data: { isActive: true, revokedAt: null },
    });
    await prisma.callCenter.update({
      where: { id: distribution.callCenterId },
      data: { isActive: false },
    });
    await request(app.getHttpServer())
      .post('/api/webhooks/callcenter')
      .set('X-API-Key', assignedCallCenterApiKey)
      .send({ ...event, external_id: 'call-center-event-inactive-center' })
      .expect(401);
  });

  afterEach(async () => {
    await waitFor(
      () =>
        prisma.distributionJob.count({
          where: { status: { not: 'COMPLETED' } },
        }),
      0,
      20_000,
    );
  });

  afterAll(async () => {
    await app.close();
    await distributionQueue.close();
    await redis.quit();
    await prisma.$disconnect();
  });
});

async function waitFor(
  query: () => Promise<number>,
  expected: number,
  timeout = 5_000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if ((await query()) === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Expected ${expected} records before timeout.`);
}
