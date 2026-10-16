import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DistributionJobStatus } from '@prisma/client';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { DistributionQueueService } from '../../providers/queue/distribution-queue.service.js';

const PUBLISH_INTERVAL_MS = 5_000;

@Injectable()
export class DistributionOutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DistributionOutboxPublisher.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly distributionQueue: DistributionQueueService,
  ) {}

  onModuleInit(): void {
    this.triggerPendingPublication();
    this.interval = setInterval(() => this.triggerPendingPublication(), PUBLISH_INTERVAL_MS);
    this.interval.unref();
  }

  onModuleDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  publish(distributionJobId: string): void {
    void this.publishOne(distributionJobId);
  }

  private triggerPendingPublication(): void {
    void this.publishPending();
  }

  private async publishPending(): Promise<void> {
    try {
      const jobs = await this.prisma.distributionJob.findMany({
        where: { status: DistributionJobStatus.PENDING, publishedAt: null },
        select: { id: true },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });
      await Promise.all(jobs.map((job) => this.publishOne(job.id)));
    } catch (error) {
      this.logPublicationError(error);
    }
  }

  private async publishOne(distributionJobId: string): Promise<void> {
    try {
      await this.distributionQueue.enqueue(distributionJobId);
      await this.prisma.distributionJob.updateMany({
        where: { id: distributionJobId, status: DistributionJobStatus.PENDING, publishedAt: null },
        data: { status: DistributionJobStatus.ENQUEUED, publishedAt: new Date() },
      });
    } catch (error) {
      this.logPublicationError(error);
    }
  }

  private logPublicationError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown queue publication error.';
    this.logger.error(message);
  }
}
