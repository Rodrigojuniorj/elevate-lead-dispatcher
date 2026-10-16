import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class CallCenterAccessService {
  assertCanAccess(user: AuthenticatedUser, callCenterId: string): void {
    if (user.role === UserRole.ADMIN || user.callCenterId === callCenterId) return;
    throw new ForbiddenException('You do not have access to this call center.');
  }
}
