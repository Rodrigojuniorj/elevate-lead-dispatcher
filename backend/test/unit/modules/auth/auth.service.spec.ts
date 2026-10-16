import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';
import { AuthService, normalizeEmail } from '../../../../src/modules/auth/auth.service.js';

const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
const user = {
  id: 'b9b16c9f-7810-4f1e-b7f1-5e589483d6bc',
  name: 'Admin User',
  email: 'admin@example.com',
  passwordHash,
  role: UserRole.ADMIN,
  callCenterId: null,
  isActive: true,
};

function createService(foundUser: typeof user | null) {
  const prisma = { user: { findUnique: vi.fn().mockResolvedValue(foundUser) } };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-jwt') };
  return { service: new AuthService(prisma as never, jwt as never), prisma, jwt };
}

describe('AuthService', () => {
  it('normalizes email before querying and returns only an access token', async () => {
    const { service, prisma, jwt } = createService(user);

    await expect(service.login({ email: ' ADMIN@EXAMPLE.COM ', password: 'correct-password' })).resolves.toEqual({
      accessToken: 'signed-jwt',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'admin@example.com' } }));
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: user.id });
  });

  it.each([
    ['an unknown user', null, 'correct-password'],
    ['an inactive user', { ...user, isActive: false }, 'correct-password'],
    ['an invalid password', user, 'wrong-password'],
  ])('rejects %s with a generic response', async (_scenario, foundUser, password) => {
    const { service } = createService(foundUser);
    await expect(service.login({ email: user.email, password })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('normalizes email consistently', () => {
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com');
  });
});
