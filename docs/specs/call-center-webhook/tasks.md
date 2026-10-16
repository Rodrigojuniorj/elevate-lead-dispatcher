# Tarefas — Webhook de call center

## 1. Contrato e segurança

- [ ] **1.1 Definir assinatura, payload e ordenação.**
  - Dependência: dispatcher concluído.
  - Resultado: SPEC e ADR descrevem autenticação, deduplicação e eventos fora de ordem.

## 2. Implementação e validação

- [ ] **2.1 Modelar identidade externa e eventos recebidos.**
  - Dependência: 1.1.
  - Resultado: constraints protegem duplicidade e auditoria.
- [ ] **2.2 Implementar endpoint de webhook.**
  - Dependência: 2.1.
  - Resultado: status e histórico são atualizados de modo seguro.
- [ ] **2.3 Testar repetição e ordem de eventos.**
  - Dependência: 2.2.
  - Resultado: duplicatas e regressões são rejeitadas ou ignoradas de forma previsível.
