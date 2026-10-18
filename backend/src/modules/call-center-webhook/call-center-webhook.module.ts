import { Module } from '@nestjs/common';
import { CallCenterWebhookController } from './call-center-webhook.controller.js';
import { CallCenterWebhookSimulationController } from './call-center-webhook-simulation.controller.js';
import { CallCenterWebhookSimulationService } from './call-center-webhook-simulation.service.js';
import { CallCenterWebhookService } from './call-center-webhook.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { CallCenterWebhookApiKeyGuard } from '../../common/webhooks/guards/call-center-webhook-api-key.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [CallCenterWebhookController, CallCenterWebhookSimulationController],
  providers: [
    CallCenterWebhookService,
    CallCenterWebhookSimulationService,
    CallCenterWebhookApiKeyGuard,
  ],
})
export class CallCenterWebhookModule {}
