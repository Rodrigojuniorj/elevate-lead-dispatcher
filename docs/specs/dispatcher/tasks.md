# Tarefas — Distribuição de leads

## 1. Decisão de estratégia

- [ ] **1.1 Selecionar e registrar o algoritmo ponderado.**
  - Dependência: nenhuma.
  - Resultado: ADR explica proporção, concorrência e trade-offs.
- [ ] **1.2 Modelar configuração e distribuição.**
  - Dependência: 1.1.
  - Resultado: migration protege uma distribuição ativa por lead.

## 2. Implementação e validação

- [ ] **2.1 Implementar dispatcher transacional.**
  - Dependência: 1.2.
  - Resultado: lead persistido é associado a call center ativo.
- [ ] **2.2 Criar rotas e autorização administrativa.**
  - Dependência: 2.1.
  - Resultado: ADMIN consulta e altera configuração; OPERATOR não acessa essas funções.
- [ ] **2.3 Testar concorrência e distribuição.**
  - Dependência: 2.1.
  - Resultado: 100 criações simultâneas mantêm consistência e distribuição esperada.
