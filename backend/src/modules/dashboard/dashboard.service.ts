import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { LeadFilterService } from '../leads/lead-filter.service.js';
import type { DashboardMetricsQueryDto } from './dto/dashboard-metrics-query.dto.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly filters: LeadFilterService) {}
  async metrics(user: AuthenticatedUser, query: DashboardMetricsQueryDto) {
    const where = await this.filters.build(user, query);
    const today = saoPauloTodayRange();
    const [totalLeads, todayLeads, distributedLeads, pendingLeads, sales] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { AND: [where, { createdAt: today }] } }),
      this.prisma.lead.count({ where: { AND: [where, { distribution: { isNot: null } }] } }),
      this.prisma.lead.count({ where: { AND: [where, { distribution: { is: null } }] } }),
      this.prisma.lead.count({ where: { AND: [where, { status: LeadStatus.SALE }] } }),
    ]);
    return { totalLeads, todayLeads, distributedLeads, pendingLeads, sales, conversionRate: totalLeads === 0 ? 0 : Number(((sales / totalLeads) * 100).toFixed(2)) };
  }
}
function saoPauloTodayRange(now = new Date()): Prisma.DateTimeFilter {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = value('year'); const month = value('month'); const day = value('day');
  if (!year || !month || !day) throw new Error('Could not resolve the São Paulo business date.');
  const start = new Date(`${year}-${month}-${day}T03:00:00.000Z`);
  return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
}
