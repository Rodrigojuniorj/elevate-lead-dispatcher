# SPEC-001: Fundação do repositório

## Status

Implementada.

## Contexto

O repositório é um monorepo sem dependências compartilhadas neste momento. Ele contém um frontend administrativo e uma API HTTP. Esta especificação estabelece somente a conectividade entre os dois processos; não define domínio, banco de dados, autenticação ou processamento assíncrono.

## Objetivo

Disponibilizar uma estrutura executável para os próximos incrementos do repositório.

## Componentes

| Componente | Diretório | Responsabilidade | Porta padrão |
| --- | --- | --- | --- |
| Frontend | `frontend/` | Painel administrativo React/Vite | `5173` |
| Backend | `backend/` | API HTTP NestJS | `3000` |

## Contrato HTTP

### `GET /api/health`

Finalidade: confirmar que a API está disponível.

Resposta de sucesso (`200 OK`):

```json
{
  "status": "ok",
  "service": "elevate-lead-dispatcher-api"
}
```

Não exige autenticação. Não acessa banco de dados. Este endpoint é apenas um contrato de infraestrutura e não representa uma regra de negócio.

## Configuração

| Variável | Componente | Valor padrão | Uso |
| --- | --- | --- | --- |
| `PORT` | backend | `3000` | Porta HTTP da API |
| `FRONTEND_URL` | backend | `http://localhost:5173` | Única origem liberada pelo CORS no ambiente local |
| `VITE_API_URL` | frontend | `http://localhost:3000/api` | URL base usada pelo navegador para chamar a API |

Os valores de exemplo ficam nos arquivos `.env.example`. Arquivos `.env` nunca devem ser versionados.

## Requisitos funcionais

1. O backend deve responder ao endpoint de saúde conforme o contrato acima.
2. O frontend deve consultar `GET /api/health` ao iniciar.
3. O frontend deve informar visualmente se a API está em verificação, disponível ou indisponível.

## Requisitos não funcionais

1. O CORS do backend deve permitir somente `FRONTEND_URL` no ambiente local.
2. Diretórios de dependências, artefatos de build, logs e dados locais não devem entrar no Git.
3. A verificação deve possuir teste unitário e teste e2e no backend.

## Fora de escopo

- PostgreSQL, Prisma e migrations.
- `POST /api/leads` e validação de payload.
- Idempotência, distribuição e concorrência.
- Workers, cache, mensageria e integrações externas.
- Autenticação e autorização.
- Docker Compose.

## Critérios de aceite

1. `npm run build`, executado em `frontend/`, termina com sucesso.
2. `npm run build`, `npm test` e `npm run test:e2e`, executados em `backend/`, terminam com sucesso.
3. `backend/node_modules`, `frontend/node_modules`, `backend/dist` e `frontend/dist` são ignorados pelo Git.

## Próxima especificação

`SPEC-002: Ingestão de leads` deve definir o modelo mínimo de dados, o contrato de `POST /api/leads`, regras de validação, resposta para duplicidade e a estratégia de idempotência.
