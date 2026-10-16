import { UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthenticatedUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Admin User' })
  name!: string;

  @ApiProperty({ format: 'email', example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', example: UserRole.ADMIN })
  role!: UserRole;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, example: null })
  callCenterId!: string | null;
}
