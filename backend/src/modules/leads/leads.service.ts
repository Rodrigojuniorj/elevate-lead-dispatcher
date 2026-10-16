import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import {
  createLeadRequestHash,
  idempotencyRequestMatches,
  INITIAL_LEAD_STATUS,
  normalizeLeadCode,
  normalizeLeadText,
} from './domain/lead-intake.policy.js';
import type { CreateLeadDto } from './dto/create-lead.dto.js';

export type CreateLeadResult = { created: boolean; leadId: string };

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto, idempotencyKey: string): Promise<CreateLeadResult> {
    const input = normalizeLeadInput(dto);
    const requestHash = createLeadRequestHash(input);
    const existingLead = await this.prisma.lead.findUnique({
      where: { idempotencyKey },
      select: { id: true, requestHash: true },
    });

    if (existingLead) return this.resolveExistingLead(existingLead, requestHash);

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
          throw new UnprocessableEntityException('The product and funnel combination is unavailable.');
        }

        const affiliate = input.affiliateCode
          ? await transaction.affiliate.findFirst({
              where: { code: input.affiliateCode, isActive: true },
              select: { id: true },
            })
          : null;

        if (input.affiliateCode && !affiliate) {
          throw new UnprocessableEntityException('The affiliate is unavailable.');
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
          },
          select: { id: true },
        });
      });

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

  private resolveExistingLead(existingLead: { id: string; requestHash: string }, requestHash: string): CreateLeadResult {
    if (!idempotencyRequestMatches(existingLead.requestHash, requestHash)) {
      throw new ConflictException('The idempotency key was already used with a different payload.');
    }

    return { created: false, leadId: existingLead.id };
  }
}

function normalizeLeadInput(dto: CreateLeadDto) {
  return {
    name: normalizeLeadText(dto.name),
    email: normalizeLeadCode(dto.email),
    phone: dto.phone.trim(),
    productCode: normalizeLeadCode(dto.productCode),
    funnelCode: normalizeLeadCode(dto.funnelCode),
    affiliateCode: dto.affiliateCode ? normalizeLeadCode(dto.affiliateCode) : null,
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
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
