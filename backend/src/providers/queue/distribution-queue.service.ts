import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import {
  DISTRIBUTION_JOB_NAME,
  DISTRIBUTION_QUEUE_NAME,
  MAX_DISTRIBUTION_JOB_ATTEMPTS,
  type DistributionQueuePayload,
} from './distribution-queue.constants.js';

@Injectable()
export class DistributionQueueService implements OnModuleDestroy {
  private readonly connection: Redis;
  private readonly queue: Queue<DistributionQueuePayload>;

  constructor(configService: ConfigService) {
    this.connection = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<DistributionQueuePayload>(DISTRIBUTION_QUEUE_NAME, {
      connection: this.connection,
    });
  }

  async enqueue(distributionJobId: string): Promise<void> {
    await this.queue.add(
      DISTRIBUTION_JOB_NAME,
      { distributionJobId },
      {
        jobId: distributionJobId,
        attempts: MAX_DISTRIBUTION_JOB_ATTEMPTS,
        backoff: { type: 'dispatcher' },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }
}
