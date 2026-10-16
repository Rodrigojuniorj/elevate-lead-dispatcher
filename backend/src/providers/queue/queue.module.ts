import { Global, Module } from '@nestjs/common';
import { DistributionQueueService } from './distribution-queue.service.js';

@Global()
@Module({
  providers: [DistributionQueueService],
  exports: [DistributionQueueService],
})
export class QueueModule {}
