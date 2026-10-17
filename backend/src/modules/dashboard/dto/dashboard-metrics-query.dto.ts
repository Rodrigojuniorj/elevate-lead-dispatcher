import { OmitType } from '@nestjs/swagger';
import { ListLeadsQueryDto } from '../../leads/dto/list-leads-query.dto.js';

export class DashboardMetricsQueryDto extends OmitType(ListLeadsQueryDto, ['pageNumber', 'pageSize'] as const) {}
