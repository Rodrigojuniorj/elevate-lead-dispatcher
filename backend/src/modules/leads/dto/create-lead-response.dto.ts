import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ format: 'uuid' })
  leadId!: string;
}
