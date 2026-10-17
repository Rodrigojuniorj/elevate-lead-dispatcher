import { ApiProperty } from '@nestjs/swagger';
export class DashboardMetricsResponseDto {
  @ApiProperty() totalLeads!: number;
  @ApiProperty() todayLeads!: number;
  @ApiProperty() distributedLeads!: number;
  @ApiProperty() pendingLeads!: number;
  @ApiProperty() sales!: number;
  @ApiProperty({ example: 12.5 }) conversionRate!: number;
}
