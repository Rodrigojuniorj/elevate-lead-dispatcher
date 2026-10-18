# Tarefas — Webhook de atualização de status

## 1. Contrato e decisões

- [x] **1.1 Definir contrato externo, outcomes e ordenação.**
  - Dependência: distribuição persistida.
  - Resultado: SPEC e ADR descrevem API key, inbox, deduplicação e precedência cronológica.

## 2. Persistência e concorrência

- [x] **2.1 Criar inbox imutável e constraints.**
  - Dependência: 1.1.
  - Resultado: migration cria `CallCenterWebhookEvent`, índice por lead/tempo e unicidade por centro/evento externo.
- [x] **2.2 Compartilhar lock de status entre webhook e ação manual.**
  - Dependência: 2.1.
  - Resultado: decisões concorrentes sobre o mesmo lead são serializadas no PostgreSQL.

## 3. Endpoint e segurança

- [x] **3.1 Validar credencial por call center e payload.**
  - Dependência: 2.1.
  - Resultado: hash de credencial autentica o call center e Swagger expõe o contrato e as respostas.
- [x] **3.2 Processar evento de forma idempotente.**
  - Dependência: 2.2 e 3.1.
  - Resultado: mudanças, rejeições e ignorados persistem com o resultado correto.

## 4. Validação

- [x] **4.1 Cobrir políticas e guard com testes unitários.**
  - Dependência: 3.2.
  - Resultado: mapeamento, hash, timestamp e API key possuem cobertura isolada.
- [x] **4.2 Cobrir endpoint em banco e Redis de teste.**
  - Dependência: 4.1.
  - Resultado: segurança, escopo, ordem, repetição e concorrência verificados.
- [x] **4.3 Executar validação completa.**
  - Dependência: 4.2.
  - Resultado: generate, migration, build, lint, unitários e e2e concluídos.
