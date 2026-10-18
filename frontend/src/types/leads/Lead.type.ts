export type LeadStatus = 'NEW' | 'CONTACTED' | 'NO_ANSWER' | 'CALLBACK' | 'QUALIFIED' | 'SALE' | 'REFUND' | 'INVALID';

export type Lead = {
  id: string;
  name: string;
  email: string;
  status: LeadStatus;
  productCode: string;
  funnelCode: string;
  source: string;
  callCenterCode: string | null;
  createdAt: string;
  allowedNextStatuses: LeadStatus[];
};

export type LeadFilters = {
  pageNumber: number;
  pageSize: number;
  from?: string;
  to?: string;
  productCode?: string;
  funnelCode?: string;
  source?: string;
  callCenterCode?: string;
  status?: LeadStatus;
};

export type LeadPage = {
  content: Lead[];
  numberOfElements: number;
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

export type CallCenterWebhookSimulation = {
  event: {
    leadId: string;
    externalId: string;
    status: string;
    timestamp: string;
  };
  response: {
    success: boolean;
    leadId: string;
    status: LeadStatus;
    outcome: 'APPLIED' | 'IGNORED_STALE' | 'IGNORED_UNCHANGED' | 'REJECTED_INVALID_TRANSITION';
  };
};
