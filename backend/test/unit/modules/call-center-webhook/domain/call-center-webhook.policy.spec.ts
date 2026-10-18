import { LeadStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  createWebhookPayloadHash,
  isWebhookTimestampTooFarInFuture,
  toLeadStatus,
} from '../../../../../src/modules/call-center-webhook/domain/call-center-webhook.policy.js';

describe('call center webhook policy', () => {
  it('converts every supported external status to the internal enum', () => {
    expect(toLeadStatus('contacted')).toBe(LeadStatus.CONTACTED);
    expect(toLeadStatus('no_answer')).toBe(LeadStatus.NO_ANSWER);
    expect(toLeadStatus('sale')).toBe(LeadStatus.SALE);
  });

  it('hashes equivalent payloads consistently without a call center payload field', () => {
    const occurredAt = new Date('2026-10-08T12:30:00.000Z');
    const input = {
      leadId: '8f3c7c2e-5b1a-4d0e-9a67-2f4c1b7e9d10',
      externalId: 'abc123',
      status: LeadStatus.CONTACTED,
      occurredAt,
    };

    expect(createWebhookPayloadHash(input)).toBe(
      createWebhookPayloadHash({ ...input }),
    );
    expect(
      createWebhookPayloadHash({ ...input, status: LeadStatus.CALLBACK }),
    ).not.toBe(createWebhookPayloadHash(input));
  });

  it('rejects timestamps more than five minutes in the future', () => {
    const now = new Date('2026-10-08T12:30:00.000Z');
    expect(
      isWebhookTimestampTooFarInFuture(
        new Date('2026-10-08T12:35:00.000Z'),
        now,
      ),
    ).toBe(false);
    expect(
      isWebhookTimestampTooFarInFuture(
        new Date('2026-10-08T12:35:00.001Z'),
        now,
      ),
    ).toBe(true);
  });
});
