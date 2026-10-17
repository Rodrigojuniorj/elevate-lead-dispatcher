import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DispatcherModule } from '../dispatcher/dispatcher.module.js';
import { LeadsController } from './leads.controller.js';
import { LeadFilterService } from './lead-filter.service.js';
import { LeadsService } from './leads.service.js';

@Module({
  imports: [AuthModule, DispatcherModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadFilterService],
  exports: [LeadFilterService],
})
export class LeadsModule {}
