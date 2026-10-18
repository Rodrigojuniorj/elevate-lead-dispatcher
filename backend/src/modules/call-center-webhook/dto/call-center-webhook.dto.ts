import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  EXTERNAL_CALL_CENTER_STATUSES,
  type ExternalCallCenterStatus,
} from '../domain/call-center-webhook.policy.js';

export class CallCenterWebhookDto {
  @ApiProperty({ name: 'lead_id', format: 'uuid' })
  @IsUUID()
  lead_id!: string;

  @ApiProperty({ name: 'external_id', example: 'abc123', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\S/, {
    message: 'external_id must contain a non-whitespace character.',
  })
  external_id!: string;

  @ApiProperty({ enum: EXTERNAL_CALL_CENTER_STATUSES, example: 'contacted' })
  @IsIn(EXTERNAL_CALL_CENTER_STATUSES)
  status!: ExternalCallCenterStatus;

  @ApiProperty({ format: 'date-time', example: '2026-10-08T12:30:00.000Z' })
  @IsDateString()
  timestamp!: string;
}
