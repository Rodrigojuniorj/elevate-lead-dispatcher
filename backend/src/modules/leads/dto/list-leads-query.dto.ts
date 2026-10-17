import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto.js';

export class ListLeadsQueryDto extends BaseFilterDto {

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Inclusive UTC creation timestamp.', example: '2026-10-17T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Exclusive UTC creation timestamp.', example: '2026-10-18T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productCode?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  funnelCode?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  callCenterCode?: string;

  @ApiPropertyOptional({ enum: LeadStatus, enumName: 'LeadStatus' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
