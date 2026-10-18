import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const callCenterCode = process.argv[2]?.trim().toUpperCase();

if (!callCenterCode) {
  throw new Error('Usage: yarn webhook:key:create <CALL_CENTER_CODE>');
}

const prisma = new PrismaClient();

try {
  const callCenter = await prisma.callCenter.findFirst({
    where: { code: callCenterCode, isActive: true },
    select: { id: true },
  });
  if (!callCenter) {
    throw new Error('An active call center with the provided code was not found.');
  }

  const apiKey = randomBytes(32).toString('base64url');
  await prisma.callCenterWebhookCredential.create({
    data: {
      callCenterId: callCenter.id,
      keyHash: hashApiKey(apiKey),
    },
  });

  console.log(`Webhook API key for ${callCenterCode}: ${apiKey}`);
  console.log('Store this key now. It cannot be retrieved from the database again.');
} finally {
  await prisma.$disconnect();
}

function hashApiKey(apiKey) {
  return createHash('sha256').update(apiKey).digest('hex');
}
