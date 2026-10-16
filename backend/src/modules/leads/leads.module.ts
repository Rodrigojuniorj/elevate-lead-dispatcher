import { Module } from '@nestjs/common';
import { DispatcherModule } from '../dispatcher/dispatcher.module.js';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';

@Module({
  imports: [DispatcherModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
