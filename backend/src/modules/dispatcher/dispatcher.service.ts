import { Injectable } from '@nestjs/common';
import { DistributionJobStatus, DistributionStrategy } from '@prisma/client';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { getDistributionRetryDelay, selectSmoothWeightedRoundRobin } from './domain/smooth-weighted-round-robin.policy.js';

const DISPATCHER_ADVISORY_LOCK_KEY = 17_403_032;

@Injectable()
export class DispatcherService {
  constructor(private readonly prisma: PrismaService) {}

  async dispatch(distributionJobId: string, attemptsMade: number): Promise<void> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${DISPATCHER_ADVISORY_LOCK_KEY})`);

        const distributionJob = await transaction.distributionJob.findUnique({
          where: { id: distributionJobId },
          select: { id: true, leadId: true, status: true },
        });
        if (!distributionJob || distributionJob.status === DistributionJobStatus.COMPLETED) return;

        const existingDistribution = await transaction.distribution.findUnique({
          where: { leadId: distributionJob.leadId },
          select: { id: true },
        });
        if (existingDistribution) {
          await transaction.distributionJob.update({
            where: { id: distributionJob.id },
            data: { status: DistributionJobStatus.COMPLETED, completedAt: new Date(), lastError: null, nextAttemptAt: null },
          });
          return;
        }

        const configurations = await transaction.callCenterDispatchConfig.findMany({
          where: { isEnabled: true, callCenter: { isActive: true } },
          select: { id: true, weight: true, currentWeight: true, callCenterId: true, callCenter: { select: { code: true } } },
          orderBy: { callCenter: { code: 'asc' } },
        });
        const selection = selectSmoothWeightedRoundRobin(
          configurations.map((configuration) => ({
            id: configuration.id,
            code: configuration.callCenter.code,
            weight: configuration.weight,
            currentWeight: configuration.currentWeight,
          })),
        );
        const selectedConfiguration = configurations.find((configuration) => configuration.id === selection.selected.id);
        if (!selectedConfiguration) throw new Error('The selected dispatch configuration is unavailable.');

        await Promise.all(
          selection.updatedCandidates.map((candidate) =>
            transaction.callCenterDispatchConfig.update({
              where: { id: candidate.id },
              data: { currentWeight: candidate.currentWeight },
            }),
          ),
        );
        await transaction.distribution.create({
          data: {
            leadId: distributionJob.leadId,
            callCenterId: selectedConfiguration.callCenterId,
            strategy: DistributionStrategy.SMOOTH_WEIGHTED_ROUND_ROBIN,
            appliedWeight: selectedConfiguration.weight,
            totalWeight: selection.totalWeight,
          },
        });
        await transaction.distributionJob.update({
          where: { id: distributionJob.id },
          data: { status: DistributionJobStatus.COMPLETED, completedAt: new Date(), lastError: null, nextAttemptAt: null },
        });
      });
    } catch (error) {
      await this.prisma.distributionJob.updateMany({
        where: { id: distributionJobId, status: { not: DistributionJobStatus.COMPLETED } },
        data: {
          attempts: { increment: 1 },
          lastError: getErrorMessage(error),
          nextAttemptAt: new Date(Date.now() + getDistributionRetryDelay(attemptsMade + 1)),
        },
      });
      throw error;
    }
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 1_000) : 'Unknown dispatcher error.';
}
