export const DISTRIBUTION_QUEUE_NAME = 'lead-distribution';
export const DISTRIBUTION_JOB_NAME = 'dispatch-lead';
export const MAX_DISTRIBUTION_JOB_ATTEMPTS = 2_147_483_647;

export type DistributionQueuePayload = {
  distributionJobId: string;
};
