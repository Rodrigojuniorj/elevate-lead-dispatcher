# Fundação

## Objetivo

Disponibilizar frontend React/Vite e API NestJS com conectividade local.

## Contrato

`GET /api/health` responde `200` com `{ "status": "ok", "service": "elevate-lead-dispatcher-api" }`.

## Critérios de aceite

- Frontend inicia em `5173` e backend em `3000` por padrão.
- CORS aceita a origem configurada por `FRONTEND_URL`.
- Dependências, builds e `.env` são ignorados pelo Git.
