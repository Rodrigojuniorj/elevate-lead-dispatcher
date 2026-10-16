import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { UtmDto } from './utm.dto.js';

export class CreateLeadDto {
  @ApiProperty({ maxLength: 200, example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'email', maxLength: 320, example: 'joao@email.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+5511999999999' })
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone!: string;

  @ApiProperty({ maxLength: 100, example: 'nutralean' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productCode!: string;

  @ApiProperty({ maxLength: 100, example: 'vsl-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  funnelCode!: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'affiliate-999' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  affiliateCode?: string;

  @ApiProperty({ maxLength: 100, example: 'facebook' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  source!: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'campaign-123' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  campaign?: string;

  @ApiPropertyOptional({ type: UtmDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDto)
  utm?: UtmDto;
}
