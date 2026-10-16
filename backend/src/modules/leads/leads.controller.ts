import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/auth/decorators/public.decorator.js';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto.js';
import { IdempotencyKey } from './decorators/idempotency-key.decorator.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { CreateLeadResponseDto } from './dto/create-lead-response.dto.js';
import { LeadsService } from './leads.service.js';
import { IdempotencyKeyPipe } from './pipes/idempotency-key.pipe.js';

@ApiTags('Leads')
@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a lead from an external source' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Unique key for safely retrying the request.' })
  @ApiBody({ type: CreateLeadDto })
  @ApiCreatedResponse({ type: CreateLeadResponseDto, description: 'A new lead was created.' })
  @ApiOkResponse({ type: CreateLeadResponseDto, description: 'An idempotent retry returned the existing lead.' })
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
}
