import { LeadStatus } from '@prisma/client';
import { createHash } from 'node:crypto';

export const INITIAL_LEAD_STATUS = LeadStatus.NEW;

export function funnelProductCanReceiveLead(funnelProductIsActive: boolean): boolean {
  return funnelProductIsActive;
}

export function idempotencyRequestMatches(storedRequestHash: string, requestHash: string): boolean {
  return storedRequestHash === requestHash;
}

export function normalizeLeadCode(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeLeadText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function createLeadRequestHash(payload: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
