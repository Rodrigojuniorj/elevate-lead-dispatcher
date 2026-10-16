import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../../../src/common/auth/guards/jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  it('bypasses passport authentication for an endpoint marked public', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new JwtAuthGuard(reflector as never);
    const context = { getHandler: () => 'handler', getClass: () => 'class' };

    expect(guard.canActivate(context as never)).toBe(true);
  });
});
