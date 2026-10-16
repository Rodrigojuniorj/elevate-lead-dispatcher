import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
      select: {
        id: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      accessToken: await this.jwtService.signAsync({ sub: user.id }),
    };
  }

  async me(user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return user;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
