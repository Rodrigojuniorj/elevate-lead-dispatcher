import { PrismaClient } from '@prisma/client';
import { seedInitialData } from './seed-data.mjs';

const prisma = new PrismaClient();

try {
  await seedInitialData(prisma);
} finally {
  await prisma.$disconnect();
}
