import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../../providers/prisma/prisma.service.js';
import type { AuthenticatedCallCenter } from '../interfaces/authenticated-call-center.interface.js';
import { hashWebhookApiKey } from '../utils/hash-webhook-api-key.js';

type WebhookRequest = Request & { callCenter?: AuthenticatedCallCenter };

@Injectable()
export class CallCenterWebhookApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WebhookRequest>();
    const providedApiKey = request.headers['x-api-key'];

    if (typeof providedApiKey !== 'string' || !providedApiKey) {
      throw new UnauthorizedException('Webhook API key is invalid.');
    }

    const credential = await this.prisma.callCenterWebhookCredential.findFirst({
      where: {
        keyHash: hashWebhookApiKey(providedApiKey),
        isActive: true,
        callCenter: { isActive: true },
      },
      select: { callCenterId: true },
    });
    if (!credential) {
      throw new UnauthorizedException('Webhook API key is invalid.');
    }

    request.callCenter = { id: credential.callCenterId };
    return true;
  }
}
