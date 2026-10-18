# Plan

`GET /api/dashboard/metrics` provides ADMIN KPIs. The paginated lead API provides the table. Shared backend filters ensure matching scope. Only ADMIN sees the manual status action; OPERATOR has a read-only lead table because call center status updates arrive through the authenticated webhook.
