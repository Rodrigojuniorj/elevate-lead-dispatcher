import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import {
  DISTRIBUTION_QUEUE_NAME,
  type DistributionQueuePayload,
} from '../../providers/queue/distribution-queue.constants.js';
import { getDistributionRetryDelay } from './domain/smooth-weighted-round-robin.policy.js';
import { DispatcherService } from './dispatcher.service.js';

@Injectable()
export class DispatcherWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DispatcherWorker.name);
  private readonly connection: Redis;
  private readonly worker: Worker<DistributionQueuePayload>;

  constructor(
    configService: ConfigService,
    private readonly dispatcherService: DispatcherService,
  ) {
    this.connection = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: null,
    });
    this.worker = new Worker<DistributionQueuePayload>(
      DISTRIBUTION_QUEUE_NAME,
      async (job) =>
        this.dispatcherService.dispatch(
          job.data.distributionJobId,
          job.attemptsMade,
        ),
      {
        connection: this.connection,
        settings: {
          backoffStrategy: (attemptsMade) =>
            getDistributionRetryDelay(attemptsMade),
        },
      },
    );
    this.worker.on('error', (error) =>
      this.logger.error(error.message, error.stack),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.worker.waitUntilReady();
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }
}
