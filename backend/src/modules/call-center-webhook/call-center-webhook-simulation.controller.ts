import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator.js';
import { Roles } from '../../common/auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto.js';
import { CallCenterWebhookSimulationService } from './call-center-webhook-simulation.service.js';
import { CallCenterWebhookSimulationResponseDto } from './dto/call-center-webhook-simulation-response.dto.js';
import { SimulateCallCenterWebhookDto } from './dto/simulate-call-center-webhook.dto.js';

@ApiTags('Call center webhook simulation')
@ApiBearerAuth('access-token')
@Roles(UserRole.OPERATOR)
@Controller('api/call-center-webhook-simulations')
export class CallCenterWebhookSimulationController {
  constructor(
    private readonly callCenterWebhookSimulationService: CallCenterWebhookSimulationService,
  ) {}

  @Post('leads/:leadId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate a call center webhook event outside production' })
  @ApiParam({ name: 'leadId', format: 'uuid' })
  @ApiBody({ type: SimulateCallCenterWebhookDto })
  @ApiOkResponse({ type: CallCenterWebhookSimulationResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
  @ApiForbiddenResponse({ type: HttpErrorResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: HttpErrorResponseDto })
  simulate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('leadId') leadId: string,
    @Body() dto: SimulateCallCenterWebhookDto,
  ): Promise<CallCenterWebhookSimulationResponseDto> {
    return this.callCenterWebhookSimulationService.simulate(user, leadId, dto);
  }
}
