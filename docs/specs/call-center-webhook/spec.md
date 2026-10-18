# Webhook de atualização de status do call center

## Objetivo

Receber eventos de atendimento enviados por call centers, autenticar a origem, atualizar o status operacional do lead quando aplicável e manter uma trilha imutável para cada evento recebido.

## Contrato

`POST /api/webhooks/callcenter` não exige JWT; ele exige `X-API-Key`. A chave identifica um único call center e somente seu hash é persistido.

Este é o único canal pelo qual um call center altera o status operacional de um lead. A rota manual autenticada é exclusiva de `ADMIN`.

Este é o único canal pelo qual um call center altera o status operacional de um lead. A rota manual autenticada é exclusiva de `ADMIN`.

```json
{
  "lead_id": "8f3c7c2e-5b1a-4d0e-9a67-2f4c1b7e9d10",
  "external_id": "abc123",
  "status": "contacted",
  "timestamp": "2026-10-08T12:30:00Z"
}
```

- `external_id` identifica um evento estável no call center, não o lead.
- Status externos são minúsculos: `new`, `contacted`, `no_answer`, `callback`, `qualified`, `sale`, `refund` e `invalid`.
- `timestamp` é ISO 8601 e não pode estar mais de cinco minutos no futuro.
- A resposta bem-sucedida contém `{ success, leadId, status, outcome }`.

## Regras de processamento

- A credencial e o call center associado devem estar ativos.
- O lead deve ter uma `Distribution` para o mesmo centro; caso contrário, a API responde `404`.
- Evento aplicável atualiza `Lead.status` e cria um único `LeadStatusHistory` com `eventSource = WEBHOOK` e `occurredAt` igual ao timestamp recebido.
- Cada evento é preservado na inbox `CallCenterWebhookEvent`, inclusive quando ignorado ou rejeitado.
- `callCenterId + externalId` é único. Mesmo payload retorna o resultado persistido; outro payload retorna `409`.
- Timestamp menor ou igual ao último status aceito resulta em `IGNORED_STALE`; mesmo status mais novo resulta em `IGNORED_UNCHANGED`.
- Uma transição inválida resulta em `REJECTED_INVALID_TRANSITION` e `422`.
- Somente `APPLIED` cria histórico operacional.

## Critérios de aceite

- API key inválida, revogada ou vinculada a centro inativo recebe `401` sem revelar o segredo.
- Lead fora do call center autenticado recebe `404`.
- Eventos válidos são aplicados uma única vez, inclusive sob concorrência.
- Eventos repetidos, atrasados e sem mudança respondem `200` sem novo histórico.
- Alterações manuais e webhook usam o mesmo lock transacional por lead.

## Simulação local por operador

Fora de produção, `POST /api/call-center-webhook-simulations/leads/:leadId` permite que um `OPERATOR` simule a entrega de um evento do seu call center. A rota exige JWT, confirma o call center ativo do operador e delega ao mesmo serviço usado pelo webhook público. O servidor gera `external_id` único e timestamp atual; a interface envia somente o próximo status permitido. Nenhuma API key é exposta ao navegador e a rota responde `404` em produção.

A resposta contém o evento que foi simulado e a resposta do processamento do webhook. Isso permite demonstrar a entrega e o resultado (`APPLIED`, `IGNORED_STALE` ou `IGNORED_UNCHANGED`) sem apresentar qualquer segredo:

```json
{
  "event": {
    "leadId": "uuid-do-lead",
    "externalId": "simulation-uuid",
    "status": "contacted",
    "timestamp": "2026-10-18T14:00:00.000Z"
  },
  "response": {
    "success": true,
    "leadId": "uuid-do-lead",
    "status": "CONTACTED",
    "outcome": "APPLIED"
  }
}
```
