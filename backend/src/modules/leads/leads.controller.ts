import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/auth/decorators/public.decorator.js';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import type { BaseFilterResponseDto } from '../../common/dto/base-filter-response.dto.js';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto.js';
import { createBaseFilterResponseDto } from '../../common/utils/create-base-filter-response-dto.js';
import { IdempotencyKey } from './decorators/idempotency-key.decorator.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { CreateLeadResponseDto } from './dto/create-lead-response.dto.js';
import { LeadDetailResponseDto, LeadListItemDto, UpdateLeadStatusResponseDto } from './dto/lead-query-response.dto.js';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto.js';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto.js';
import { LeadsService } from './leads.service.js';
import { IdempotencyKeyPipe } from './pipes/idempotency-key.pipe.js';

@ApiTags('Leads')
@ApiBearerAuth('access-token')
@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a lead from an external source' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key for safely retrying the request.',
  })
  @ApiBody({ type: CreateLeadDto })
  @ApiCreatedResponse({
    type: CreateLeadResponseDto,
    description: 'A new lead was created.',
  })
  @ApiOkResponse({
    type: CreateLeadResponseDto,
    description: 'An idempotent retry returned the existing lead.',
  })
  @ApiBadRequestResponse({ type: HttpErrorResponseDto })
  @ApiConflictResponse({ type: HttpErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: HttpErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
  @Post()
  async create(
    @IdempotencyKey(IdempotencyKeyPipe) idempotencyKey: string,
    @Body() dto: CreateLeadDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CreateLeadResponseDto> {
    const result = await this.leadsService.create(dto, idempotencyKey);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return { success: true, leadId: result.leadId };
  }

  @ApiOperation({ summary: 'List leads within the authenticated user scope' })
  @ApiOkResponse({ type: createBaseFilterResponseDto(LeadListItemDto) })
  @ApiBadRequestResponse({ type: HttpErrorResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
  @ApiForbiddenResponse({ type: HttpErrorResponseDto })
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLeadsQueryDto,
  ): Promise<BaseFilterResponseDto<LeadListItemDto>> {
    return this.leadsService.list(user, query);
  }

  @ApiOperation({ summary: 'Get lead details within the authenticated user scope' })
  @ApiOkResponse({ type: LeadDetailResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
  @ApiForbiddenResponse({ type: HttpErrorResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  @Get(':leadId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('leadId') leadId: string,
  ): Promise<LeadDetailResponseDto> {
    return this.leadsService.findOne(user, leadId);
  }

  @ApiOperation({ summary: 'Update the status of a lead within the authenticated user scope' })
  @ApiBody({ type: UpdateLeadStatusDto })
  @ApiOkResponse({ type: UpdateLeadStatusResponseDto })
  @ApiBadRequestResponse({ type: HttpErrorResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
  @ApiForbiddenResponse({ type: HttpErrorResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: HttpErrorResponseDto })
  @Patch(':leadId/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadStatusDto,
  ): Promise<UpdateLeadStatusResponseDto> {
    return this.leadsService.updateStatus(user, leadId, dto);
  }
}
