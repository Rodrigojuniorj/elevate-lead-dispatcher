import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '../../apis/dashboard/dashboard.api';
import { getLeads, patchLeadStatus } from '../../apis/leads/leads.api';
import { useAuth } from '../../contexts/Auth.context';
import type { DashboardMetrics } from '../../types/dashboard/DashboardMetrics.type';
import type { Lead, LeadFilters, LeadPage, LeadStatus } from '../../types/leads/Lead.type';

const emptyFilters: LeadFilters = { pageNumber: 0, pageSize: 20 };

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'Novo', CONTACTED: 'Contactado', NO_ANSWER: 'Sem resposta', CALLBACK: 'Retornar contato',
  QUALIFIED: 'Qualificado', SALE: 'Venda', REFUND: 'Reembolso', INVALID: 'Inválido',
};

const metricDefinitions: Array<{ key: keyof DashboardMetrics; label: string; detail: string }> = [
  { key: 'totalLeads', label: 'Total de leads', detail: 'No recorte atual' },
  { key: 'todayLeads', label: 'Leads hoje', detail: 'Horário de São Paulo' },
  { key: 'distributedLeads', label: 'Distribuídos', detail: 'Com destino definido' },
  { key: 'pendingLeads', label: 'Pendentes', detail: 'Aguardando distribuição' },
  { key: 'sales', label: 'Vendas', detail: 'Status convertido' },
  { key: 'conversionRate', label: 'Conversão', detail: 'Vendas sobre o total' },
];

function toInputDate(value?: string): string { return value ? new Date(value).toISOString().slice(0, 16) : ''; }
function formatMetric(key: keyof DashboardMetrics, value: number): string { return key === 'conversionRate' ? `${value.toFixed(1)}%` : new Intl.NumberFormat('pt-BR').format(value); }
function formatDate(value: string): string { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function LeadStatusBadge({ status }: { status: LeadStatus }) { return <span className={`status-badge status-badge--${status.toLowerCase().replace('_', '-')}`}>{statusLabels[status]}</span>; }
function LeadsIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.75h5.5v5.5H5zM13.5 4.75H19v5.5h-5.5zM5 13.25h5.5v5.5H5zM13.5 13.25H19v5.5h-5.5z" /></svg>; }

export function DashboardPage() {
  const { signOut, user } = useAuth();
  const [draftFilters, setDraftFilters] = useState<LeadFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<LeadFilters>(emptyFilters);
  const [page, setPage] = useState<LeadPage | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');

  async function load(filters: LeadFilters) {
    setIsLoading(true); setError('');
    try {
      const leadPage = await getLeads(filters);
      const dashboardMetrics = user?.role === 'ADMIN' ? await getDashboardMetrics(filters) : null;
      setPage(leadPage); setMetrics(dashboardMetrics);
    } catch { setError('Não foi possível carregar os dados agora. Tente novamente.'); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { if (user) void load(emptyFilters); }, [user?.role]);
  if (!user) return null;

  function setFilter<Key extends keyof LeadFilters>(key: Key, value: LeadFilters[Key]) {
    setDraftFilters((current) => ({ ...current, pageNumber: 0, [key]: value || undefined }));
  }
  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const nextFilters = { ...draftFilters, pageNumber: 0 };
    setAppliedFilters(nextFilters); setIsFilterOpen(false); void load(nextFilters);
  }
  function resetFilters() { setDraftFilters(emptyFilters); setAppliedFilters(emptyFilters); void load(emptyFilters); }
  function changePage(pageNumber: number) { const nextFilters = { ...appliedFilters, pageNumber }; setAppliedFilters(nextFilters); void load(nextFilters); }
  async function updateStatus(lead: Lead, status: LeadStatus) {
    if (!status) return;
    setUpdatingLeadId(lead.id); setError('');
    try { await patchLeadStatus(lead.id, status); await load(appliedFilters); }
    catch { setError('Não foi possível atualizar o status deste lead.'); }
    finally { setUpdatingLeadId(null); }
  }

  const hasFilters = Object.entries(draftFilters).some(([key, value]) => !['pageNumber', 'pageSize'].includes(key) && value);
  const initial = user.name.trim().charAt(0).toUpperCase();
  return (
    <main className={`operations-layout ${isSidebarOpen ? 'operations-layout--sidebar-open' : ''}`}>
      <header className="global-appbar"><button className="menu-button" type="button" aria-label="Alternar menu" onClick={() => setIsSidebarOpen((current) => !current)}>☰</button><div className="application-title"><span className="application-icon"><LeadsIcon /></span><b>Elevate Lead Dispatcher</b></div><div className="global-account"><span>Olá, {user.name}</span><span className="profile-avatar">{initial}</span><button className="sign-out-button" type="button" onClick={signOut}>Sair</button></div></header>
      <aside className="app-sidebar">
        <nav className="sidebar-nav" aria-label="Navegação principal"><p>Operação</p><a className="sidebar-nav__item sidebar-nav__item--active" href="/"><span className="sidebar-nav__icon"><LeadsIcon /></span><span className="sidebar-nav__label">Leads</span></a></nav>
      </aside>
      <div className="operations-page">
      <section className="workspace-heading"><div><p className="breadcrumbs">Operação <span>/</span> Leads</p><h1>Leads</h1></div></section>
      {user.role === 'ADMIN' && <section className="metric-strip" aria-label="Métricas do recorte atual">{metricDefinitions.map(({ key, label, detail }) => <article className="metric-item" key={key}><span>{label}</span><strong>{metrics ? formatMetric(key, metrics[key]) : '—'}</strong><small>{detail}</small></article>)}</section>}
      <section className="lead-workspace">
        <div className="panel-heading"><div><p className="section-kicker">Registros</p><h2>Todos os leads</h2></div><div className="table-toolbar"><span className="result-count">{page ? `${page.totalElements} resultado${page.totalElements === 1 ? '' : 's'}` : 'Carregando resultados'}</span><button className="filter-toggle" type="button" onClick={() => setIsFilterOpen(true)}>Filtrar</button></div></div>
        {isFilterOpen && <div className="filter-layer"><button className="filter-backdrop" type="button" aria-label="Fechar filtros" onClick={() => setIsFilterOpen(false)} /><form className="filter-popover" onSubmit={applyFilters}><div className="filter-popover__header"><div><p className="section-kicker">Consulta</p><h3>Filtrar leads</h3></div><button className="popover-close" type="button" aria-label="Fechar filtros" onClick={() => setIsFilterOpen(false)}>×</button></div><div className="filter-bar">
          <label><span>Data inicial</span><input type="datetime-local" value={toInputDate(draftFilters.from)} onChange={(event) => setFilter('from', event.target.value ? new Date(event.target.value).toISOString() : undefined)} /></label>
          <label><span>Data final</span><input type="datetime-local" value={toInputDate(draftFilters.to)} onChange={(event) => setFilter('to', event.target.value ? new Date(event.target.value).toISOString() : undefined)} /></label>
          <label><span>Produto</span><input value={draftFilters.productCode ?? ''} placeholder="Ex.: nutralean" onChange={(event) => setFilter('productCode', event.target.value)} /></label>
          <label><span>Funil</span><input value={draftFilters.funnelCode ?? ''} placeholder="Ex.: vsl-01" onChange={(event) => setFilter('funnelCode', event.target.value)} /></label>
          <label><span>Origem</span><input value={draftFilters.source ?? ''} placeholder="Ex.: landing-page" onChange={(event) => setFilter('source', event.target.value)} /></label>
          <label><span>Status</span><select value={draftFilters.status ?? ''} onChange={(event) => setFilter('status', event.target.value as LeadStatus | undefined)}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
          {user.role === 'ADMIN' && <label><span>Call center</span><input value={draftFilters.callCenterCode ?? ''} placeholder="Ex.: call-center-a" onChange={(event) => setFilter('callCenterCode', event.target.value)} /></label>}
          </div><div className="filter-actions"><button className="text-button" type="button" disabled={!hasFilters} onClick={resetFilters}>Limpar</button><button className="apply-button" type="submit">Aplicar filtros</button></div>
        </form></div>}
        {error && <p className="dashboard-error" role="alert">{error}</p>}
        <div className="table-frame"><table><thead><tr><th>Lead</th><th>Produto</th><th>Origem</th><th>Destino</th><th>Status</th><th>Recebido em</th><th><span className="sr-only">Ação</span></th></tr></thead><tbody>
          {isLoading && <tr><td className="table-message" colSpan={7}><span className="loading-dot" />Atualizando a fila…</td></tr>}
          {!isLoading && page?.content.length === 0 && <tr><td className="table-message" colSpan={7}>Nenhum lead encontrado para este recorte.</td></tr>}
          {!isLoading && page?.content.map((lead) => <tr key={lead.id}><td><strong>{lead.name}</strong><small>{lead.email}</small></td><td><span className="code-chip">{lead.productCode}</span><small>{lead.funnelCode}</small></td><td>{lead.source}</td><td>{lead.callCenterCode ?? <span className="muted-value">Pendente</span>}</td><td><LeadStatusBadge status={lead.status} /></td><td><time dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time></td><td className="row-action">{user.role === 'OPERATOR' && lead.allowedNextStatuses.length > 0 && <select aria-label={`Alterar status de ${lead.name}`} disabled={updatingLeadId === lead.id} defaultValue="" onChange={(event) => void updateStatus(lead, event.target.value as LeadStatus)}><option value="">Atualizar</option>{lead.allowedNextStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>}</td></tr>)}
        </tbody></table>{page && page.totalPages > 1 && <footer className="table-footer"><span>Página <b>{page.pageNumber + 1}</b> de <b>{page.totalPages}</b></span><div><button className="pagination-button" type="button" disabled={page.pageNumber === 0 || isLoading} onClick={() => changePage(page.pageNumber - 1)}>Anterior</button><button className="pagination-button" type="button" disabled={page.pageNumber + 1 >= page.totalPages || isLoading} onClick={() => changePage(page.pageNumber + 1)}>Próxima</button></div></footer>}</div>
      </section>
      </div>
    </main>
  );
}
