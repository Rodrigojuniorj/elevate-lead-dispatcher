import { apiClient } from '../../clients/http/api.client';
import type { DashboardMetrics } from '../../types/dashboard/DashboardMetrics.type';
import type { LeadFilters } from '../../types/leads/Lead.type';
export const getDashboardMetrics = (filters: LeadFilters) => apiClient.request<DashboardMetrics>(`/dashboard/metrics?${new URLSearchParams(Object.entries(filters).filter(([key, value]) => !['pageNumber', 'pageSize'].includes(key) && value !== undefined && value !== '').map(([key, value]) => [key, String(value)])).toString()}`);
