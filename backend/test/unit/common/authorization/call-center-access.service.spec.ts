import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { CallCenterAccessService } from '../../../../src/common/authorization/call-center-access.service.js';

const service = new CallCenterAccessService({
  callCenter: { findFirst: vi.fn() },
} as never);

describe('CallCenterAccessService', () => {
  it('allows an administrator to access any call center', () => {
    expect(() => service.assertCanAccess({ id: 'admin', name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, callCenterId: null }, 'center-a')).not.toThrow();
  });

  it('allows an operator to access its own call center only', () => {
    const operator = { id: 'operator', name: 'Operator', email: 'operator@example.com', role: UserRole.OPERATOR, callCenterId: 'center-a' };
    expect(() => service.assertCanAccess(operator, 'center-a')).not.toThrow();
    expect(() => service.assertCanAccess(operator, 'center-b')).toThrow(ForbiddenException);
  });
});
