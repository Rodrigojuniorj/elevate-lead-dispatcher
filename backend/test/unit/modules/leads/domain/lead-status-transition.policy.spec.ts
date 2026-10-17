import { LeadStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { isLeadStatusTransitionAllowed, isLeadStatusUnchanged } from '../../../../../src/modules/leads/domain/lead-status-transition.policy.js';

describe('lead status transition policy', () => {
  it('allows the configured transition path', () => {
    expect(isLeadStatusTransitionAllowed(LeadStatus.NEW, LeadStatus.CONTACTED)).toBe(true);
    expect(isLeadStatusTransitionAllowed(LeadStatus.QUALIFIED, LeadStatus.SALE)).toBe(true);
    expect(isLeadStatusTransitionAllowed(LeadStatus.SALE, LeadStatus.REFUND)).toBe(true);
  });

  it('rejects invalid and terminal transitions', () => {
    expect(isLeadStatusTransitionAllowed(LeadStatus.NEW, LeadStatus.SALE)).toBe(false);
    expect(isLeadStatusTransitionAllowed(LeadStatus.REFUND, LeadStatus.CONTACTED)).toBe(false);
    expect(isLeadStatusTransitionAllowed(LeadStatus.INVALID, LeadStatus.NEW)).toBe(false);
  });

  it('recognizes a repeated status as a no-op', () => {
    expect(isLeadStatusUnchanged(LeadStatus.CONTACTED, LeadStatus.CONTACTED)).toBe(true);
  });
});
