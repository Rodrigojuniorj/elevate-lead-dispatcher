# Distribuição assíncrona de leads

## Objetivo

Distribuir cada lead criado a um call center elegível sem bloquear o recebimento HTTP, preservando a decisão no banco e tolerando indisponibilidade temporária do Redis ou do worker.

## Comportamento

- Uma criação inédita em `POST /api/leads` grava, na mesma transação, o lead, seu evento inicial `NEW` e um trabalho de distribuição único.
- A resposta permanece `201` com o `leadId`; ela confirma persistência, não a atribuição imediata.
- Repetição com a mesma `Idempotency-Key` e payload retorna `200`, reutiliza o lead e nunca cria ou publica outro trabalho.
- Após o commit, o trabalho é publicado na fila `lead-distribution`. Um worker persiste exatamente uma `Distribution` para cada lead.
- O status comercial do lead continua independente do estado da distribuição.
- Leads anteriores à instalação desta feature não recebem trabalho retroativo.

## Regras de distribuição

- Um call center é elegível apenas quando `CallCenter.isActive` e `CallCenterDispatchConfig.isEnabled` são verdadeiros.
- Cada configuração possui peso inteiro positivo e relativo. As seeds iniciais são A=50, B=30 e C=20.
- Centros não elegíveis são excluídos; os pesos dos elegíveis são automaticamente normalizados pelo algoritmo.
- A estratégia é Smooth Weighted Round Robin. Em dez atribuições com os pesos iniciais, o resultado é exatamente 5 para A, 3 para B e 2 para C.
- Cada lead possui no máximo uma distribuição persistida.

## Falhas e recuperação

- PostgreSQL mantém o trabalho como fonte de verdade até a conclusão.
- Se Redis estiver indisponível, o publicador mantém o trabalho pendente e tenta publicá-lo periodicamente.
- Falhas do worker preservam o job na fila e repetem indefinidamente após 1 minuto, 5 minutos, 15 minutos e, depois, no máximo a cada 1 hora.
- Somente jobs concluídos com uma distribuição persistida são removidos da fila. O registro de auditoria no PostgreSQL não é removido.

## Limites desta feature

- Não há endpoint ou tela para alterar pesos.
- Não há integração real com call centers externos.
- Não há backfill de leads criados antes desta migration.
