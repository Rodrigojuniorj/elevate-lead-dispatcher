import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedCallCenter } from '../interfaces/authenticated-call-center.interface.js';

export const CurrentWebhookCallCenter = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedCallCenter => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { callCenter: AuthenticatedCallCenter }>();
    return request.callCenter;
  },
);
