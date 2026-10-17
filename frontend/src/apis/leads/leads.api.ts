import { apiClient } from '../../clients/http/api.client';
import type { LeadFilters, LeadPage, LeadStatus } from '../../types/leads/Lead.type';
const query = (filters: LeadFilters) => new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])).toString();
export const getLeads = (filters: LeadFilters) => apiClient.request<LeadPage>(`/leads?${query(filters)}`);
export const patchLeadStatus = (id: string, status: LeadStatus) => apiClient.request(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
