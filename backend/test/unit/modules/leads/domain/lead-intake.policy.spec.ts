import { LeadStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  idempotencyRequestMatches,
  INITIAL_LEAD_STATUS,
  funnelProductCanReceiveLead,
  createLeadRequestHash,
  normalizeLeadCode,
  normalizeLeadText,
} from '../../../../../src/modules/leads/domain/lead-intake.policy.js';

describe('lead intake policy', () => {
  it('accepts an active product and funnel association', () => {
    expect(funnelProductCanReceiveLead(true)).toBe(true);
  });

  it('rejects an inactive product and funnel association', () => {
    expect(funnelProductCanReceiveLead(false)).toBe(false);
  });

  it('uses NEW as the initial lead status', () => {
    expect(INITIAL_LEAD_STATUS).toBe(LeadStatus.NEW);
  });

  it('matches only an idempotency retry with the same request hash', () => {
    expect(idempotencyRequestMatches('same-hash', 'same-hash')).toBe(true);
    expect(idempotencyRequestMatches('stored-hash', 'different-hash')).toBe(false);
  });

  it('normalizes codes and user text before hashing a request', () => {
    expect(normalizeLeadCode(' NutraLean ')).toBe('nutralean');
    expect(normalizeLeadText('  João   Silva ')).toBe('João Silva');
    expect(createLeadRequestHash({ name: 'João Silva', code: 'nutralean' })).toBe(
      createLeadRequestHash({ name: 'João Silva', code: 'nutralean' }),
    );
  });
});
