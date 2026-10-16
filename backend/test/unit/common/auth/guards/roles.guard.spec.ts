import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from '../../../../../src/common/auth/guards/roles.guard.js';

function contextWith(role?: UserRole) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  };
}

describe('RolesGuard', () => {
  it('allows a matching role and rejects another role', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]) };
    const guard = new RolesGuard(reflector as never);
    expect(guard.canActivate(contextWith(UserRole.ADMIN) as never)).toBe(true);
    expect(guard.canActivate(contextWith(UserRole.OPERATOR) as never)).toBe(false);
  });

  it('allows authenticated routes without an explicit role requirement', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    expect(new RolesGuard(reflector as never).canActivate(contextWith(UserRole.OPERATOR) as never)).toBe(true);
  });
});
