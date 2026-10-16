import { Module } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service.js';
import { DispatcherWorker } from './dispatcher.worker.js';
import { DistributionOutboxPublisher } from './distribution-outbox.publisher.js';

@Module({
  providers: [DispatcherService, DispatcherWorker, DistributionOutboxPublisher],
  exports: [DistributionOutboxPublisher],
})
export class DispatcherModule {}
