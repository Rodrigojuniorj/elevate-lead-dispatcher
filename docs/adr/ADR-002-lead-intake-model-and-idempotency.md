# ADR-002 — Modelo de recebimento de leads e idempotência

## Contexto

O recebimento de leads precisa relacionar produto, funil, afiliado, dados de tracking e histórico de status, além de tolerar reenvios da mesma requisição.

## Decisão

- `Funnel` e `Product` possuem relação muitos-para-muitos por `FunnelProduct`.
- `FunnelProduct` possui estado próprio e representa uma oferta válida. `Lead` referencia essa associação, o que impede pares produto/funil inexistentes no banco.
- `Affiliate` é opcional e identificado por código.
- O status inicial é `NEW`; toda alteração terá evento imutável em `LeadStatusHistory`.
- O contrato futuro exige `Idempotency-Key`. A chave é única no banco e acompanha `requestHash` para distinguir repetição válida de reutilização com payload diferente.

## Consequências

O modelo permite filtros e auditoria desde a primeira criação, sem denormalizar produto e funil no lead. O caso de uso futuro localizará a associação ativa por códigos dentro de uma transação e processará a repetição pela chave de idempotência.
