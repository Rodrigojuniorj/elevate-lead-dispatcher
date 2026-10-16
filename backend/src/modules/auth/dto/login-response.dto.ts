import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token.', example: 'eyJhbGciOiJIUzI1NiJ9...' })
  accessToken!: string;
}
