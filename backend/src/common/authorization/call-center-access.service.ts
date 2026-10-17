import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../../providers/prisma/prisma.service.js';

@Injectable()
export class CallCenterAccessService {
  constructor(private readonly prisma: PrismaService) {}

  assertCanAccess(user: AuthenticatedUser, callCenterId: string): void {
    if (user.role === UserRole.ADMIN || user.callCenterId === callCenterId) return;
    throw new ForbiddenException('You do not have access to this call center.');
  }

  async resolveActiveOperatorCallCenterId(user: AuthenticatedUser): Promise<string | null> {
    if (user.role === UserRole.ADMIN) return null;
    if (!user.callCenterId) throw new ForbiddenException('The operator does not have an active call center.');

    const callCenter = await this.prisma.callCenter.findFirst({
      where: { id: user.callCenterId, isActive: true },
      select: { id: true },
    });
    if (!callCenter) throw new ForbiddenException('The operator does not have an active call center.');
    return callCenter.id;
  }
}
