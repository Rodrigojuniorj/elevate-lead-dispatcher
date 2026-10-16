# Distribuição de leads

## Objetivo

Distribuir cada lead persistido para um call center ativo, respeitando pesos configuráveis e mantendo registro auditável da decisão.

## Requisitos

- Cada lead recebe no máximo uma distribuição ativa.
- Os call centers iniciais A, B e C usam pesos 50%, 30% e 20%.
- A configuração de pesos é administrada por `ADMIN`.
- O mecanismo permanece correto quando múltiplos leads chegam simultaneamente.
- A distribuição registra call center, peso aplicado, estratégia e instante da decisão.

## Contrato futuro

O fluxo de criação de lead delega a distribuição para o dispatcher após persistir o lead. Rotas administrativas permitirão consultar distribuição e alterar pesos. Operadores não acessam a configuração.
