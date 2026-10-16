# Tarefas — Recebimento de leads

## 1. Especificação do domínio

- [x] **1.1 Definir o contrato de recebimento de lead.**
  - Dependência: nenhuma.
  - Resultado: campos por código, cabeçalho de idempotência, resposta e fluxo completo documentados.
  - Requisitos: R-01 a R-07.
- [x] **1.2 Registrar a decisão de modelagem.**
  - Dependência: 1.1.
  - Resultado: associação produto/funil, status e idempotência documentados como decisão duradoura.
  - Requisitos: R-01, R-04, R-05.

## 2. Persistência

- [x] **2.1 Modelar catálogos comerciais e lead.**
  - Dependência: 1.1.
  - Resultado: `Funnel`, `Product`, `FunnelProduct`, `Affiliate` e `Lead` possuem relações e nomes de banco em inglês.
  - Requisitos: R-01 a R-03.
- [x] **2.2 Modelar status e histórico imutável.**
  - Dependência: 2.1.
  - Resultado: status atual e eventos históricos suportam o ciclo de vida futuro.
  - Requisitos: R-04.
- [x] **2.3 Versionar constraints e índices da entrada de leads.**
  - Dependência: 2.1 e 2.2.
  - Resultado: migration protege a chave de idempotência e otimiza filtros futuros.
  - Requisitos: R-01, R-03, R-05.

## 3. Regras e verificação

- [x] **3.1 Criar regras puras de domínio.**
  - Dependência: 2.1 e 2.2.
  - Resultado: associação ativa produto/funil, status `NEW` e comparação de hashes são verificáveis sem banco.
  - Requisitos: R-01, R-04, R-05.
- [x] **3.2 Validar schema, migration, build e testes.**
  - Dependência: 2.3 e 3.1.
  - Resultado: Prisma Client é gerado e a suíte de backend permanece íntegra.
  - Requisitos: R-01 a R-05.

## 4. Entrada de leads

- [x] **4.1 Criar seeds idempotentes do catálogo comercial.**
  - Dependência: 3.2.
  - Resultado: funis, produtos, associações produto/funil e afiliados de desenvolvimento estão disponíveis.
  - Requisitos: R-01, R-02.
- [x] **4.2 Implementar `POST /api/leads`.**
  - Dependência: 4.1.
  - Resultado: DTO, validação de catálogos, transação de criação, evento inicial e contrato Swagger.
  - Requisitos: R-01 a R-06.
- [x] **4.3 Aplicar idempotência executável.**
  - Dependência: 4.2.
  - Resultado: repetição segura retorna o resultado original; reutilização de chave com outro payload retorna conflito.
  - Requisitos: R-05.

## 5. Integrações posteriores

- [ ] **5.1 Encaminhar o lead persistido ao dispatcher.**
  - Dependência: feature `dispatcher` concluída.
  - Resultado: cada lead criado recebe uma distribuição persistida para um call center.
  - Requisitos: R-07.
- [ ] **5.2 Atualizar status pelo webhook do call center.**
  - Dependência: feature `webhook-call-center` concluída.
  - Resultado: eventos externos atualizam status e mantêm auditoria.
  - Requisitos: R-04, R-07.
- [ ] **5.3 Exibir e consultar leads na interface administrativa.**
  - Dependência: endpoints de consulta e distribuição concluídos.
  - Resultado: operadores e administradores acessam os dados conforme seus escopos.
  - Requisitos: R-03, R-04, R-07.
