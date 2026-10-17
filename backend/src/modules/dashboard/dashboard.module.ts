import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
@Module({ imports: [LeadsModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
