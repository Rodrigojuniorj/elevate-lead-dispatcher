import { LeadStatus } from '@prisma/client';

const allowedTransitions: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  [LeadStatus.NEW]: [LeadStatus.CONTACTED, LeadStatus.NO_ANSWER, LeadStatus.CALLBACK, LeadStatus.QUALIFIED, LeadStatus.INVALID],
  [LeadStatus.CONTACTED]: [LeadStatus.NO_ANSWER, LeadStatus.CALLBACK, LeadStatus.QUALIFIED, LeadStatus.SALE, LeadStatus.INVALID],
  [LeadStatus.NO_ANSWER]: [LeadStatus.CONTACTED, LeadStatus.CALLBACK, LeadStatus.INVALID],
  [LeadStatus.CALLBACK]: [LeadStatus.CONTACTED, LeadStatus.NO_ANSWER, LeadStatus.QUALIFIED, LeadStatus.INVALID],
  [LeadStatus.QUALIFIED]: [LeadStatus.SALE, LeadStatus.INVALID],
  [LeadStatus.SALE]: [LeadStatus.REFUND],
  [LeadStatus.REFUND]: [],
  [LeadStatus.INVALID]: [],
};

export function isLeadStatusTransitionAllowed(currentStatus: LeadStatus, nextStatus: LeadStatus): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function isLeadStatusUnchanged(currentStatus: LeadStatus, nextStatus: LeadStatus): boolean {
  return currentStatus === nextStatus;
}
