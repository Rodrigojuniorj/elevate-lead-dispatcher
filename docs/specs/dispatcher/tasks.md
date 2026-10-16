# Tarefas — Distribuição assíncrona

## 1. Decisões e documentação

- [x] **1.1 Registrar o outbox transacional.**
  - Dependência: nenhuma.
  - Resultado: PostgreSQL permanece fonte de verdade entre API e Redis.
- [x] **1.2 Registrar Smooth Weighted Round Robin.**
  - Dependência: nenhuma.
  - Resultado: pesos relativos e concorrência possuem decisão duradoura.

## 2. Infraestrutura e persistência

- [x] **2.1 Adicionar Redis e configuração validada.**
  - Dependência: 1.1.
  - Resultado: desenvolvimento e testes usam URLs Redis separadas.
- [x] **2.2 Modelar configuração, outbox e distribuição.**
  - Dependência: 1.1 e 1.2.
  - Resultado: migration protege pesos positivos e unicidade por lead.
- [x] **2.3 Semear pesos iniciais.**
  - Dependência: 2.2.
  - Resultado: A, B e C ficam habilitados com 50, 30 e 20.

## 3. Publicação e consumo

- [x] **3.1 Criar trabalho na transação do lead.**
  - Dependência: 2.2.
  - Resultado: repetição idempotente não duplica trabalho.
- [x] **3.2 Publicar jobs pendentes no BullMQ.**
  - Dependência: 2.1 e 3.1.
  - Resultado: publicação recuperável e `jobId` estável.
- [x] **3.3 Consumir e persistir distribuição.**
  - Dependência: 2.2 e 3.2.
  - Resultado: worker usa lock transacional e remove somente jobs concluídos.

## 4. Verificação

- [x] **4.1 Testar regra ponderada e retries.**
  - Dependência: 3.3.
  - Resultado: sequência 50/30/20 e backoff são verificáveis sem infraestrutura.
- [x] **4.2 Testar integração e concorrência.**
  - Dependência: 3.3.
  - Resultado: 100 leads concorrentes produzem 100 distribuições únicas na proporção esperada.
- [x] **4.3 Validar build, lint e suítes.**
  - Dependência: 4.1 e 4.2.
  - Resultado: backend permanece íntegro.
