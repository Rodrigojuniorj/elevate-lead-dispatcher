import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UtmDto {
  @ApiPropertyOptional({ maxLength: 255, example: 'facebook' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'cpc' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  medium?: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'campaign-123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaign?: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'ad-01' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  content?: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'weight-loss' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  term?: string;
}
