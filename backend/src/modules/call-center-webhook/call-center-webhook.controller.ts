import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators/public.decorator.js';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto.js';
import { CurrentWebhookCallCenter } from '../../common/webhooks/decorators/current-webhook-call-center.decorator.js';
import { CallCenterWebhookApiKeyGuard } from '../../common/webhooks/guards/call-center-webhook-api-key.guard.js';
import type { AuthenticatedCallCenter } from '../../common/webhooks/interfaces/authenticated-call-center.interface.js';
import { CallCenterWebhookService } from './call-center-webhook.service.js';
import { CallCenterWebhookDto } from './dto/call-center-webhook.dto.js';
import { CallCenterWebhookResponseDto } from './dto/call-center-webhook-response.dto.js';

@ApiTags('Call center webhook')
@Public()
@UseGuards(CallCenterWebhookApiKeyGuard)
@Controller('api/webhooks/callcenter')
export class CallCenterWebhookController {
  constructor(
    private readonly callCenterWebhookService: CallCenterWebhookService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a call center status event' })
  @ApiHeader({
    name: 'X-API-Key',
    required: true,
    description: 'API key assigned to the originating call center.',
  })
  @ApiBody({ type: CallCenterWebhookDto })
  @ApiOkResponse({ type: CallCenterWebhookResponseDto })
  @ApiBadRequestResponse({ type: HttpErrorResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  @ApiConflictResponse({ type: HttpErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: HttpErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
  process(
    @Body() dto: CallCenterWebhookDto,
    @CurrentWebhookCallCenter() callCenter: AuthenticatedCallCenter,
  ): Promise<CallCenterWebhookResponseDto> {
    return this.callCenterWebhookService.process(dto, callCenter.id);
  }
}
