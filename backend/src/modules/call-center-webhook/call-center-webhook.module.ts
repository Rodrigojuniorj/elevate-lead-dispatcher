import { Module } from '@nestjs/common';
import { CallCenterWebhookController } from './call-center-webhook.controller.js';
import { CallCenterWebhookService } from './call-center-webhook.service.js';
import { CallCenterWebhookApiKeyGuard } from '../../common/webhooks/guards/call-center-webhook-api-key.guard.js';

@Module({
  controllers: [CallCenterWebhookController],
  providers: [CallCenterWebhookService, CallCenterWebhookApiKeyGuard],
})
export class CallCenterWebhookModule {}
