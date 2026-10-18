import { ApiProperty } from '@nestjs/swagger';
import { CallCenterWebhookEventOutcome, LeadStatus } from '@prisma/client';

export class CallCenterWebhookResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ format: 'uuid' })
  leadId!: string;

  @ApiProperty({ enum: LeadStatus, enumName: 'LeadStatus' })
  status!: LeadStatus;

  @ApiProperty({
    enum: CallCenterWebhookEventOutcome,
    enumName: 'CallCenterWebhookEventOutcome',
  })
  outcome!: CallCenterWebhookEventOutcome;
}
