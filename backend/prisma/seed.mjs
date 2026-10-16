import { PrismaClient } from '@prisma/client';
import { seedInitialAdmin } from './seeds/initial-admin.seed.mjs';
import { seedInitialCallCenter } from './seeds/initial-call-center.seed.mjs';

const prisma = new PrismaClient();

try {
  await seedInitialCallCenter(prisma);
  await seedInitialAdmin(prisma);
} finally {
  await prisma.$disconnect();
}
