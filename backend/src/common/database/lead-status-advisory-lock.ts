import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';

const LEAD_STATUS_LOCK_NAMESPACE = 'elevate-lead-status';

/** Serializes every status decision for one lead inside the current transaction. */
export async function acquireLeadStatusAdvisoryLock(
  transaction: Prisma.TransactionClient,
  leadId: string,
): Promise<void> {
  const lockKey = createHash('sha256')
    .update(`${LEAD_STATUS_LOCK_NAMESPACE}:${leadId}`)
    .digest()
    .readInt32BE(0);

  await transaction.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${lockKey})`,
  );
}
