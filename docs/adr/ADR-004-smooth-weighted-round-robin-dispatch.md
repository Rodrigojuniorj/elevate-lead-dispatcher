# ADR-004 — Smooth Weighted Round Robin para distribuição

## Contexto

Call centers possuem capacidade relativa e a distribuição precisa permanecer correta com vários workers e requisições simultâneas.

## Decisão

- Usar Smooth Weighted Round Robin com pesos inteiros positivos e relativos.
- Persistir `currentWeight` por configuração de call center.
- Usar advisory lock transacional global do PostgreSQL ao selecionar e atualizar pesos.
- Ignorar call centers inativos ou desabilitados e normalizar os pesos dos elegíveis.
- Persistir a estratégia, peso aplicado e peso total em cada distribuição.

## Consequências

A proporção é determinística em lotes curtos e auditável. A decisão de distribuição é serializada para proteger consistência; se a carga futura exigir, o escopo do lock poderá evoluir sem mudar o contrato do dispatcher.
