import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadStatusEventSource } from '@prisma/client';

export class LeadListItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() phone!: string;
  @ApiProperty({ enum: LeadStatus, enumName: 'LeadStatus' }) status!: LeadStatus;
  @ApiProperty() productCode!: string;
  @ApiProperty() funnelCode!: string;
  @ApiPropertyOptional({ nullable: true }) affiliateCode!: string | null;
  @ApiProperty() source!: string;
  @ApiPropertyOptional({ nullable: true }) campaign!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiPropertyOptional({ nullable: true }) callCenterCode!: string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) assignedAt!: Date | null;
  @ApiProperty({ enum: LeadStatus, isArray: true }) allowedNextStatuses!: LeadStatus[];
}

export class LeadStatusHistoryItemDto {
  @ApiProperty({ enum: LeadStatus, enumName: 'LeadStatus' }) status!: LeadStatus;
  @ApiProperty({ enum: LeadStatusEventSource, enumName: 'LeadStatusEventSource' }) eventSource!: LeadStatusEventSource;
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date;
}

export class LeadDetailResponseDto extends LeadListItemDto {
  @ApiPropertyOptional({ nullable: true }) utmSource!: string | null;
  @ApiPropertyOptional({ nullable: true }) utmMedium!: string | null;
  @ApiPropertyOptional({ nullable: true }) utmCampaign!: string | null;
  @ApiPropertyOptional({ nullable: true }) utmContent!: string | null;
  @ApiPropertyOptional({ nullable: true }) utmTerm!: string | null;
  @ApiProperty({ type: [LeadStatusHistoryItemDto] }) statusHistory!: LeadStatusHistoryItemDto[];
}

export class UpdateLeadStatusResponseDto {
  @ApiProperty({ format: 'uuid' }) leadId!: string;
  @ApiProperty({ enum: LeadStatus, enumName: 'LeadStatus' }) status!: LeadStatus;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
  @ApiProperty() changed!: boolean;
}
