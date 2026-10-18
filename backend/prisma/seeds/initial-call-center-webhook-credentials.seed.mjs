import { createHash } from 'node:crypto';

const initialWebhookCredentials = [
  {
    callCenterCode: 'CALL-CENTER-A',
    apiKey: 'elevate-webhook-call-center-a-2026',
  },
  {
    callCenterCode: 'CALL-CENTER-B',
    apiKey: 'elevate-webhook-call-center-b-2026',
  },
  {
    callCenterCode: 'CALL-CENTER-C',
    apiKey: 'elevate-webhook-call-center-c-2026',
  },
];

export async function seedInitialCallCenterWebhookCredentials(prisma) {
  await prisma.$transaction(async (transaction) => {
    for (const credential of initialWebhookCredentials) {
      const callCenter = await transaction.callCenter.findUniqueOrThrow({
        where: { code: credential.callCenterCode },
        select: { id: true },
      });

      await transaction.callCenterWebhookCredential.upsert({
        where: { keyHash: hashApiKey(credential.apiKey) },
        update: {
          callCenterId: callCenter.id,
          isActive: true,
          revokedAt: null,
        },
        create: {
          callCenterId: callCenter.id,
          keyHash: hashApiKey(credential.apiKey),
        },
      });
    }
  });
}

function hashApiKey(apiKey) {
  return createHash('sha256').update(apiKey).digest('hex');
}
