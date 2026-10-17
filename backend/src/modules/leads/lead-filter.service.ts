import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { CallCenterAccessService } from '../../common/authorization/call-center-access.service.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import type { ListLeadsQueryDto } from './dto/list-leads-query.dto.js';

@Injectable()
export class LeadFilterService {
  constructor(private readonly prisma: PrismaService, private readonly access: CallCenterAccessService) {}

  async build(user: AuthenticatedUser, query: Pick<ListLeadsQueryDto, 'from' | 'to' | 'productCode' | 'funnelCode' | 'source' | 'callCenterCode' | 'status'>): Promise<Prisma.LeadWhereInput> {
    if (query.from && query.to && new Date(query.from) >= new Date(query.to)) throw new BadRequestException('The from timestamp must be earlier than to.');
    const callCenterId = await this.access.resolveActiveOperatorCallCenterId(user);
    const filters: Prisma.LeadWhereInput[] = [callCenterId ? { distribution: { is: { callCenterId } } } : {}];
    if (callCenterId && query.callCenterCode) {
      const own = await this.prisma.callCenter.findUnique({ where: { id: callCenterId }, select: { code: true } });
      if (!own || own.code.toLowerCase() !== query.callCenterCode.trim().toLowerCase()) return { id: { in: [] } };
    }
    if (query.from || query.to) filters.push({ createdAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lt: new Date(query.to) } : {}) } });
    if (query.status) filters.push({ status: query.status });
    if (query.source) filters.push({ source: { equals: query.source.trim(), mode: 'insensitive' } });
    if (query.productCode) filters.push({ funnelProduct: { product: { code: { equals: query.productCode.trim(), mode: 'insensitive' } } } });
    if (query.funnelCode) filters.push({ funnelProduct: { funnel: { code: { equals: query.funnelCode.trim(), mode: 'insensitive' } } } });
    if (user.role === UserRole.ADMIN && query.callCenterCode) filters.push({ distribution: { is: { callCenter: { code: { equals: query.callCenterCode.trim(), mode: 'insensitive' } } } } });
    return { AND: filters };
  }
}
