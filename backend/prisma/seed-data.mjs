import { seedInitialAdmin } from './seeds/initial-admin.seed.mjs';
import { seedInitialCallCenter } from './seeds/initial-call-center.seed.mjs';
import { seedInitialCallCenterWebhookCredentials } from './seeds/initial-call-center-webhook-credentials.seed.mjs';
import { seedInitialLeadCatalog } from './seeds/initial-lead-catalog.seed.mjs';
import { seedInitialOperators } from './seeds/initial-operators.seed.mjs';

export async function seedInitialData(prisma) {
  await seedInitialCallCenter(prisma);
  await seedInitialCallCenterWebhookCredentials(prisma);
  await seedInitialLeadCatalog(prisma);
  await seedInitialAdmin(prisma);
  await seedInitialOperators(prisma);
}
