import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { CallCenterAccessService } from '../../common/authorization/call-center-access.service.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import type { CallCenterWebhookSimulationResponseDto } from './dto/call-center-webhook-simulation-response.dto.js';
import type { SimulateCallCenterWebhookDto } from './dto/simulate-call-center-webhook.dto.js';
import { CallCenterWebhookService } from './call-center-webhook.service.js';

@Injectable()
export class CallCenterWebhookSimulationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly callCenterAccessService: CallCenterAccessService,
    private readonly callCenterWebhookService: CallCenterWebhookService,
  ) {}

  async simulate(
    user: AuthenticatedUser,
    leadId: string,
    dto: SimulateCallCenterWebhookDto,
  ): Promise<CallCenterWebhookSimulationResponseDto> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException('Simulation endpoint is unavailable.');
    }

    const callCenterId =
      await this.callCenterAccessService.resolveActiveOperatorCallCenterId(user);
    if (!callCenterId) {
      throw new ForbiddenException('Only call center operators can simulate webhook events.');
    }

    const event = {
      lead_id: leadId,
      external_id: `simulation-${randomUUID()}`,
      status: dto.status.toLowerCase() as Lowercase<typeof dto.status>,
      timestamp: new Date().toISOString(),
    };
    const response = await this.callCenterWebhookService.process(event, callCenterId);

    return {
      event: {
        leadId: event.lead_id,
        externalId: event.external_id,
        status: event.status,
        timestamp: event.timestamp,
      },
      response,
    };
  }
}
