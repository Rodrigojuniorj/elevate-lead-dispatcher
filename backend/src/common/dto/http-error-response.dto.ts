import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Invalid email or password.' },
      { type: 'array', items: { type: 'string' }, example: ['email must be an email'] },
    ],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Unauthorized' })
  error!: string;
}
