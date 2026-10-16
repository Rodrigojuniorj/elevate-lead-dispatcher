import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ format: 'email', maxLength: 320, example: 'admin@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ format: 'password', minLength: 1, maxLength: 256, example: 'secure-password' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password!: string;
}
