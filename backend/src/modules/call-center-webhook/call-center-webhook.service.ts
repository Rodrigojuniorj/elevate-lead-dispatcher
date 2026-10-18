import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CallCenterWebhookEventOutcome,
  LeadStatusEventSource,
  Prisma,
} from '@prisma/client';
import { acquireLeadStatusAdvisoryLock } from '../../common/database/lead-status-advisory-lock.js';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import {
  createWebhookPayloadHash,
  isWebhookTimestampTooFarInFuture,
  toLeadStatus,
} from './domain/call-center-webhook.policy.js';
import type { CallCenterWebhookDto } from './dto/call-center-webhook.dto.js';
import type { CallCenterWebhookResponseDto } from './dto/call-center-webhook-response.dto.js';
import {
  isLeadStatusTransitionAllowed,
  isLeadStatusUnchanged,
} from '../leads/domain/lead-status-transition.policy.js';

@Injectable()
export class CallCenterWebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async process(
    dto: CallCenterWebhookDto,
    callCenterId: string,
  ): Promise<CallCenterWebhookResponseDto> {
    const input = normalizeWebhookInput(dto);
    if (isWebhookTimestampTooFarInFuture(input.occurredAt)) {
      throw new UnprocessableEntityException(
        'The webhook timestamp cannot be more than five minutes in the future.',
      );
    }

    const existingEvent = await this.prisma.callCenterWebhookEvent.findUnique({
      where: {
        callCenterId_externalId: {
          callCenterId,
          externalId: input.externalId,
        },
      },
    });
    if (existingEvent)
      return this.resolveExistingEvent(existingEvent, input.payloadHash);

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        await acquireLeadStatusAdvisoryLock(transaction, input.leadId);

        const lead = await transaction.lead.findFirst({
          where: {
            id: input.leadId,
            distribution: { is: { callCenterId } },
          },
          select: {
            id: true,
            status: true,
            statusHistory: {
              orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
              take: 1,
              select: { occurredAt: true },
            },
          },
        });
        if (!lead) throw new NotFoundException('Lead not found.');

        const latestAcceptedEvent = lead.statusHistory[0];
        const outcome = this.resolveOutcome(
          lead.status,
          latestAcceptedEvent?.occurredAt,
          input,
        );
        const resultingStatus = lead.status;

        if (outcome === CallCenterWebhookEventOutcome.APPLIED) {
          await transaction.lead.update({
            where: { id: lead.id },
            data: {
              status: input.status,
              statusHistory: {
                create: {
                  status: input.status,
                  eventSource: LeadStatusEventSource.WEBHOOK,
                  occurredAt: input.occurredAt,
                },
              },
            },
          });
        }

        const event = await transaction.callCenterWebhookEvent.create({
          data: {
            callCenterId,
            leadId: lead.id,
            externalId: input.externalId,
            status: input.status,
            resultingStatus:
              outcome === CallCenterWebhookEventOutcome.APPLIED
                ? input.status
                : resultingStatus,
            occurredAt: input.occurredAt,
            payloadHash: input.payloadHash,
            outcome,
          },
        });

        return toWebhookResponse(event);
      });

      if (
        result.outcome ===
        CallCenterWebhookEventOutcome.REJECTED_INVALID_TRANSITION
      ) {
        throw new UnprocessableEntityException(
          'The status transition is not allowed.',
        );
      }

      return result;
    } catch (error) {
      if (!isExternalEventConflict(error)) throw error;

      const concurrentEvent =
        await this.prisma.callCenterWebhookEvent.findUnique({
          where: {
            callCenterId_externalId: {
              callCenterId,
              externalId: input.externalId,
            },
          },
        });
      if (!concurrentEvent) throw error;
      return this.resolveExistingEvent(concurrentEvent, input.payloadHash);
    }
  }

  private resolveOutcome(
    currentStatus: ReturnType<typeof toLeadStatus>,
    latestOccurredAt: Date | undefined,
    input: NormalizedWebhookInput,
  ): CallCenterWebhookEventOutcome {
    if (latestOccurredAt && input.occurredAt <= latestOccurredAt) {
      return CallCenterWebhookEventOutcome.IGNORED_STALE;
    }
    if (isLeadStatusUnchanged(currentStatus, input.status)) {
      return CallCenterWebhookEventOutcome.IGNORED_UNCHANGED;
    }
    if (!isLeadStatusTransitionAllowed(currentStatus, input.status)) {
      return CallCenterWebhookEventOutcome.REJECTED_INVALID_TRANSITION;
    }
    return CallCenterWebhookEventOutcome.APPLIED;
  }

  private resolveExistingEvent(
    event: {
      leadId: string;
      payloadHash: string;
      resultingStatus: ReturnType<typeof toLeadStatus>;
      outcome: CallCenterWebhookEventOutcome;
    },
    payloadHash: string,
  ): CallCenterWebhookResponseDto {
    if (event.payloadHash !== payloadHash) {
      throw new ConflictException(
        'The external event identifier was already used with a different payload.',
      );
    }
    if (
      event.outcome ===
      CallCenterWebhookEventOutcome.REJECTED_INVALID_TRANSITION
    ) {
      throw new UnprocessableEntityException(
        'The status transition is not allowed.',
      );
    }
    return {
      success: true,
      leadId: event.leadId,
      status: event.resultingStatus,
      outcome: event.outcome,
    };
  }
}

type NormalizedWebhookInput = {
  leadId: string;
  externalId: string;
  status: ReturnType<typeof toLeadStatus>;
  occurredAt: Date;
  payloadHash: string;
};

function normalizeWebhookInput(
  dto: CallCenterWebhookDto,
): NormalizedWebhookInput {
  const occurredAt = new Date(dto.timestamp);
  const input = {
    leadId: dto.lead_id,
    externalId: dto.external_id.trim(),
    status: toLeadStatus(dto.status),
    occurredAt,
  };

  return {
    ...input,
    payloadHash: createWebhookPayloadHash(input),
  };
}

function toWebhookResponse(event: {
  leadId: string;
  resultingStatus: ReturnType<typeof toLeadStatus>;
  outcome: CallCenterWebhookEventOutcome;
}): CallCenterWebhookResponseDto {
  return {
    success: true,
    leadId: event.leadId,
    status: event.resultingStatus,
    outcome: event.outcome,
  };
}

function isExternalEventConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
