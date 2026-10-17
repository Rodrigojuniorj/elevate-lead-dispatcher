import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator.js';
import { Roles } from '../../common/auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardMetricsQueryDto } from './dto/dashboard-metrics-query.dto.js';
import { DashboardMetricsResponseDto } from './dto/dashboard-metrics-response.dto.js';
@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get dashboard metrics within selected filters' })
  @ApiOkResponse({ type: DashboardMetricsResponseDto })
  @ApiForbiddenResponse()
  @Get('metrics')
  metrics(@CurrentUser() user: AuthenticatedUser, @Query() query: DashboardMetricsQueryDto): Promise<DashboardMetricsResponseDto> { return this.dashboard.metrics(user, query); }
}
