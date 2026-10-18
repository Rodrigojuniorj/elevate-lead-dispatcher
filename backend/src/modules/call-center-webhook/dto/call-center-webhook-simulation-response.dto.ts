import { ApiProperty } from '@nestjs/swagger';
import type { ExternalCallCenterStatus } from '../domain/call-center-webhook.policy.js';
import { CallCenterWebhookResponseDto } from './call-center-webhook-response.dto.js';

export class SimulatedCallCenterWebhookEventDto {
  @ApiProperty({ format: 'uuid' })
  leadId!: string;

  @ApiProperty({ example: 'simulation-5e642e23-546f-4f65-a1df-837874e31b75' })
  externalId!: string;

  @ApiProperty({ example: 'contacted' })
  status!: ExternalCallCenterStatus;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}

export class CallCenterWebhookSimulationResponseDto {
  @ApiProperty({ type: SimulatedCallCenterWebhookEventDto })
  event!: SimulatedCallCenterWebhookEventDto;

  @ApiProperty({ type: CallCenterWebhookResponseDto })
  response!: CallCenterWebhookResponseDto;
}
