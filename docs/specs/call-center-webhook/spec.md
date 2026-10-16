# Webhook de call center

## Objetivo

Receber atualizações externas de atendimento, atualizar o status atual do lead e preservar histórico auditável sem processar eventos duplicados ou fora de ordem incorretamente.

## Requisitos

- O endpoint recebe identificador do lead, identificador externo, status e instante do evento.
- Apenas status permitidos são aceitos.
- A origem do webhook é autenticada.
- Repetições do mesmo evento não alteram o lead novamente.
- Eventos antigos não podem regredir um status terminal.

## Contrato futuro

`POST /api/webhooks/callcenter` validará a assinatura da origem, localizará a distribuição e registrará cada evento aceito em `LeadStatusHistory`.
