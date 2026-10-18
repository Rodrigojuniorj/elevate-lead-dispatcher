import { createHash } from 'node:crypto';
import { LeadStatus } from '@prisma/client';

export const EXTERNAL_CALL_CENTER_STATUSES = [
  'new',
  'contacted',
  'no_answer',
  'callback',
  'qualified',
  'sale',
  'refund',
  'invalid',
] as const;

export type ExternalCallCenterStatus =
  (typeof EXTERNAL_CALL_CENTER_STATUSES)[number];

const statusByExternalValue: Readonly<
  Record<ExternalCallCenterStatus, LeadStatus>
> = {
  new: LeadStatus.NEW,
  contacted: LeadStatus.CONTACTED,
  no_answer: LeadStatus.NO_ANSWER,
  callback: LeadStatus.CALLBACK,
  qualified: LeadStatus.QUALIFIED,
  sale: LeadStatus.SALE,
  refund: LeadStatus.REFUND,
  invalid: LeadStatus.INVALID,
};

export function toLeadStatus(status: ExternalCallCenterStatus): LeadStatus {
  return statusByExternalValue[status];
}

export function createWebhookPayloadHash(input: {
  leadId: string;
  externalId: string;
  status: LeadStatus;
  occurredAt: Date;
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        leadId: input.leadId,
        externalId: input.externalId,
        status: input.status,
        occurredAt: input.occurredAt.toISOString(),
      }),
    )
    .digest('hex');
}

export function isWebhookTimestampTooFarInFuture(
  occurredAt: Date,
  now: Date = new Date(),
): boolean {
  return occurredAt.getTime() > now.getTime() + 5 * 60 * 1000;
}
