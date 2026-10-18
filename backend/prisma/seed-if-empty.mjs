import { PrismaClient } from '@prisma/client';
import { seedInitialData } from './seed-data.mjs';

const prisma = new PrismaClient();

const baseEntityCounts = [
  ['users', () => prisma.user.count()],
  ['call centers', () => prisma.callCenter.count()],
  ['funnels', () => prisma.funnel.count()],
  ['products', () => prisma.product.count()],
  ['funnel products', () => prisma.funnelProduct.count()],
  ['affiliates', () => prisma.affiliate.count()],
];

try {
  const counts = await Promise.all(baseEntityCounts.map(([, count]) => count()));

  if (counts.every((count) => count === 0)) {
    await seedInitialData(prisma);
    console.info('Database was empty. Initial data was created.');
  } else {
    console.info('Database already contains base data. Initial seed was skipped.');
  }
} finally {
  await prisma.$disconnect();
}
