import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CallCenterWebhookApiKeyGuard } from '../../../../../src/common/webhooks/guards/call-center-webhook-api-key.guard.js';
import { hashWebhookApiKey } from '../../../../../src/common/webhooks/utils/hash-webhook-api-key.js';

const apiKey = 'call-center-webhook-api-key-at-least-32-characters';

describe('CallCenterWebhookApiKeyGuard', () => {
  it('authenticates an active credential and attaches its call center', async () => {
    const guard = new CallCenterWebhookApiKeyGuard(
      prismaForCredential('call-center-a'),
    );
    const context = contextWithApiKey(apiKey);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.request.callCenter).toEqual({ id: 'call-center-a' });
  });

  it('rejects absent, invalid and array API keys', async () => {
    const guard = new CallCenterWebhookApiKeyGuard(prismaForCredential(null));

    await expect(
      guard.canActivate(contextWithApiKey(undefined)),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      guard.canActivate(contextWithApiKey('invalid-key')),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      guard.canActivate(contextWithApiKey([apiKey])),
    ).rejects.toThrow(UnauthorizedException);
  });
});

function prismaForCredential(callCenterId: string | null) {
  return {
    callCenterWebhookCredential: {
      findFirst: async ({ where }: { where: { keyHash: string } }) =>
        where.keyHash === hashWebhookApiKey(apiKey) && callCenterId
          ? { callCenterId }
          : null,
    },
  } as never;
}

function contextWithApiKey(apiKeyValue: string | string[] | undefined) {
  const request = { headers: { 'x-api-key': apiKeyValue } };
  return {
    request,
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}
