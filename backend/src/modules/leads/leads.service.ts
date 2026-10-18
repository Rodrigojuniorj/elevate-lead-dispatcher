import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LeadStatusEventSource, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import { paginate } from '../../common/pagination/pagination.helper.js';
import { acquireLeadStatusAdvisoryLock } from '../../common/database/lead-status-advisory-lock.js';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { DistributionOutboxPublisher } from '../dispatcher/distribution-outbox.publisher.js';
import {
  createLeadRequestHash,
  idempotencyRequestMatches,
  INITIAL_LEAD_STATUS,
  normalizeLeadCode,
  normalizeLeadText,
} from './domain/lead-intake.policy.js';
import type { CreateLeadDto } from './dto/create-lead.dto.js';
import type { ListLeadsQueryDto } from './dto/list-leads-query.dto.js';
import type { UpdateLeadStatusDto } from './dto/update-lead-status.dto.js';
import {
  isLeadStatusTransitionAllowed,
  isLeadStatusUnchanged,
  getAllowedNextLeadStatuses,
} from './domain/lead-status-transition.policy.js';
import { LeadFilterService } from './lead-filter.service.js';

export type CreateLeadResult = { created: boolean; leadId: string };

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly distributionOutboxPublisher: DistributionOutboxPublisher,
    private readonly leadFilterService: LeadFilterService,
  ) {}

  async create(
    dto: CreateLeadDto,
    idempotencyKey: string,
  ): Promise<CreateLeadResult> {
    const input = normalizeLeadInput(dto);
    const requestHash = createLeadRequestHash(input);
    const existingLead = await this.prisma.lead.findUnique({
      where: { idempotencyKey },
      select: { id: true, requestHash: true },
    });

    if (existingLead)
      return this.resolveExistingLead(existingLead, requestHash);

    try {
      const lead = await this.prisma.$transaction(async (transaction) => {
        const funnelProduct = await transaction.funnelProduct.findFirst({
          where: {
            isActive: true,
            funnel: { code: input.funnelCode, isActive: true },
            product: { code: input.productCode, isActive: true },
          },
          select: { id: true },
        });

        if (!funnelProduct) {
          throw new UnprocessableEntityException(
            'The product and funnel combination is unavailable.',
          );
        }

        const affiliate = input.affiliateCode
          ? await transaction.affiliate.findFirst({
              where: { code: input.affiliateCode, isActive: true },
              select: { id: true },
            })
          : null;

        if (input.affiliateCode && !affiliate) {
          throw new UnprocessableEntityException(
            'The affiliate is unavailable.',
          );
        }

        return transaction.lead.create({
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            funnelProductId: funnelProduct.id,
            affiliateId: affiliate?.id,
            source: input.source,
            campaign: input.campaign,
            utmSource: input.utm.source,
            utmMedium: input.utm.medium,
            utmCampaign: input.utm.campaign,
            utmContent: input.utm.content,
            utmTerm: input.utm.term,
            status: INITIAL_LEAD_STATUS,
            idempotencyKey,
            requestHash,
            statusHistory: {
              create: {
                status: INITIAL_LEAD_STATUS,
                eventSource: 'SYSTEM',
              },
            },
            distributionJob: {
              create: {},
            },
          },
          select: { id: true, distributionJob: { select: { id: true } } },
        });
      });

      this.distributionOutboxPublisher.publish(lead.distributionJob!.id);
      return { created: true, leadId: lead.id };
    } catch (error) {
      if (!isIdempotencyKeyConflict(error)) throw error;

      const concurrentLead = await this.prisma.lead.findUnique({
        where: { idempotencyKey },
        select: { id: true, requestHash: true },
      });

      if (!concurrentLead) throw error;
      return this.resolveExistingLead(concurrentLead, requestHash);
    }
  }

  async list(user: AuthenticatedUser, query: ListLeadsQueryDto) {
    const where = await this.leadFilterService.build(user, query);
    return paginate(
      query,
      async (skip, take) =>
        (
          await this.prisma.lead.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip,
            take,
            include: leadInclude,
          })
        ).map(toLeadListItem),
      () => this.prisma.lead.count({ where }),
    );
  }

  async findOne(user: AuthenticatedUser, leadId: string) {
    const scope = await this.leadFilterService.build(user, {});
    const lead = await this.prisma.lead.findFirst({
      where: { AND: [scope, { id: leadId }] },
      include: {
        ...leadInclude,
        statusHistory: {
          orderBy: { occurredAt: 'asc' },
          select: { status: true, eventSource: true, occurredAt: true },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found.');
    return {
      ...toLeadListItem(lead),
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      utmContent: lead.utmContent,
      utmTerm: lead.utmTerm,
      statusHistory: lead.statusHistory,
    };
  }

  async updateStatus(
    user: AuthenticatedUser,
    leadId: string,
    dto: UpdateLeadStatusDto,
  ) {
    const scope = await this.leadFilterService.build(user, {});
    return this.prisma.$transaction(async (transaction) => {
      await acquireLeadStatusAdvisoryLock(transaction, leadId);
      const lead = await transaction.lead.findFirst({
        where: { AND: [scope, { id: leadId }] },
        select: { id: true, status: true, updatedAt: true },
      });
      if (!lead) throw new NotFoundException('Lead not found.');
      if (isLeadStatusUnchanged(lead.status, dto.status))
        return {
          leadId: lead.id,
          status: lead.status,
          updatedAt: lead.updatedAt,
          changed: false,
        };
      if (!isLeadStatusTransitionAllowed(lead.status, dto.status))
        throw new UnprocessableEntityException(
          'The status transition is not allowed.',
        );

      const updatedLead = await transaction.lead.update({
        where: { id: lead.id },
        data: {
          status: dto.status,
          statusHistory: {
            create: {
              status: dto.status,
              eventSource: LeadStatusEventSource.MANUAL,
            },
          },
        },
        select: { id: true, status: true, updatedAt: true },
      });
      return {
        leadId: updatedLead.id,
        status: updatedLead.status,
        updatedAt: updatedLead.updatedAt,
        changed: true,
      };
    });
  }

  private resolveExistingLead(
    existingLead: { id: string; requestHash: string },
    requestHash: string,
  ): CreateLeadResult {
    if (!idempotencyRequestMatches(existingLead.requestHash, requestHash)) {
      throw new ConflictException(
        'The idempotency key was already used with a different payload.',
      );
    }

    return { created: false, leadId: existingLead.id };
  }
}

const leadInclude = {
  funnelProduct: {
    include: {
      funnel: { select: { code: true } },
      product: { select: { code: true } },
    },
  },
  affiliate: { select: { code: true } },
  distribution: { include: { callCenter: { select: { code: true } } } },
} satisfies Prisma.LeadInclude;

function toLeadListItem(
  lead: Prisma.LeadGetPayload<{ include: typeof leadInclude }>,
) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    productCode: lead.funnelProduct.product.code,
    funnelCode: lead.funnelProduct.funnel.code,
    affiliateCode: lead.affiliate?.code ?? null,
    source: lead.source,
    campaign: lead.campaign,
    createdAt: lead.createdAt,
    callCenterCode: lead.distribution?.callCenter.code ?? null,
    assignedAt: lead.distribution?.assignedAt ?? null,
    allowedNextStatuses: [...getAllowedNextLeadStatuses(lead.status)],
  };
}

function normalizeLeadInput(dto: CreateLeadDto) {
  return {
    name: normalizeLeadText(dto.name),
    email: normalizeLeadCode(dto.email),
    phone: dto.phone.trim(),
    productCode: normalizeLeadCode(dto.productCode),
    funnelCode: normalizeLeadCode(dto.funnelCode),
    affiliateCode: dto.affiliateCode
      ? normalizeLeadCode(dto.affiliateCode)
      : null,
    source: normalizeLeadCode(dto.source),
    campaign: dto.campaign ? normalizeLeadText(dto.campaign) : null,
    utm: {
      source: dto.utm?.source ? normalizeLeadCode(dto.utm.source) : null,
      medium: dto.utm?.medium ? normalizeLeadCode(dto.utm.medium) : null,
      campaign: dto.utm?.campaign ? normalizeLeadText(dto.utm.campaign) : null,
      content: dto.utm?.content ? normalizeLeadText(dto.utm.content) : null,
      term: dto.utm?.term ? normalizeLeadText(dto.utm.term) : null,
    },
  };
}

function isIdempotencyKeyConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
