# Tarefas — Consulta e atualização manual de leads

## 1. Contratos e regras

- [x] **1.1 Definir DTOs de cursor, filtros e detalhe.**
  - Dependência: nenhuma.
  - Resultado: paginação e filtros possuem contrato Swagger validado.
- [x] **1.2 Implementar política de transição de status.**
  - Dependência: nenhuma.
  - Resultado: transições manuais são puras e testáveis.
- [x] **1.3 Definir filtro de escopo por perfil.**
  - Dependência: 1.1.
  - Resultado: `ADMIN` e `OPERATOR` não compartilham a mesma visão de dados indevidamente.

## 2. Persistência e backend

- [x] **2.1 Adicionar migration e índices de consulta.**
  - Dependência: 1.1 e 1.3.
  - Resultado: paginação e filtros mantêm desempenho conforme o volume cresce.
- [x] **2.2 Implementar listagem paginada.**
  - Dependência: 2.1.
  - Resultado: `GET /api/leads` aplica filtros e escopo no banco.
- [x] **2.3 Implementar detalhe autorizado.**
  - Dependência: 2.2.
  - Resultado: `GET /api/leads/:leadId` retorna dados operacionais e histórico sem expor segredos.
- [x] **2.4 Implementar atualização manual de status.**
  - Dependência: 1.2 e 1.3.
  - Resultado: `PATCH /api/leads/:leadId/status` grava estado e evento de forma atômica.

## 3. Validação

- [x] **3.1 Testar transições válidas, inválidas e repetidas.**
  - Dependência: 2.4.
  - Resultado: nenhuma regressão ou evento duplicado é gravado.
- [x] **3.2 Testar escopo de ADMIN e OPERATOR.**
  - Dependência: 2.2, 2.3 e 2.4.
  - Resultado: operador não consulta nem altera lead de outro call center.
- [x] **3.3 Testar filtros, cursor e paginação.**
  - Dependência: 2.2.
  - Resultado: páginas estáveis e filtros corretos.
- [x] **3.4 Executar build, lint, unitários e e2e.**
  - Dependência: 3.1 a 3.3.
  - Resultado: feature integrada sem regressões.
