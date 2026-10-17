# ADR-005 — Server-side dashboard metrics

Metrics are calculated by the backend with the same filters and scope as lead queries. The business timezone is `America/Sao_Paulo`; conversion is `SALE / totalLeads`, with zero for an empty denominator. `pendingLeads` means no persisted `Distribution`.
