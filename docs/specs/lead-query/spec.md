# Consulta e atualização manual de leads

## Objetivo

Disponibilizar consultas autenticadas de leads e atualização manual de status, aplicando o escopo de acesso no backend. A feature atende a operação diária sem antecipar métricas, dashboard ou webhook.

## Endpoints

### `GET /api/leads`

Lista leads com paginação por página, ordenada por `createdAt DESC, id DESC`.

Parâmetros opcionais:

- `pageNumber`: página baseada em zero, padrão `0`.
- `pageSize`: quantidade de itens, padrão `20`, máximo `100`.
- `from` e `to`: intervalo UTC de criação em ISO 8601. `from` é inclusivo e `to` é exclusivo.
- `productCode`, `funnelCode`, `source`, `callCenterCode` e `status`.

A resposta segue o contrato comum de filtro: `content`, `numberOfElements`, `pageNumber`, `pageSize`, `totalElements` e `totalPages`. Cada item apresenta apenas dados operacionais: identidade e contato do lead, produto, funil, afiliado, origem, campanha, status, criação e distribuição quando houver. Não expõe `requestHash` ou `idempotencyKey`.

### `GET /api/leads/:leadId`

Retorna o detalhe de um lead dentro do escopo do usuário, incluindo catálogo, tracking, distribuição e histórico de status em ordem cronológica.

### `PATCH /api/leads/:leadId/status`

Recebe `{ "status": "CONTACTED" }`, atualiza o status atual e cria um novo `LeadStatusHistory` com `eventSource = MANUAL` na mesma transação.

## Autorização e escopo

- Todas as rotas exigem JWT.
- `ADMIN` consulta qualquer lead e pode filtrar por qualquer call center.
- `ADMIN` também pode atualizar o status de qualquer lead.
- `OPERATOR` consulta somente leads cuja `Distribution.callCenterId` corresponde ao seu `User.callCenterId`.
- `OPERATOR` atualiza status somente dentro desse mesmo escopo.
- O filtro de call center informado por `OPERATOR` não amplia escopo: se for incompatível, a API retorna lista vazia; o escopo sempre vem do usuário autenticado.
- Um `OPERATOR` sem call center ativo recebe `403 Forbidden`.
- Para detalhe ou atualização fora do escopo, a API retorna `404 Not Found`, evitando revelar a existência do lead.
- A autorização ocorre na query e na mutação do backend; esconder controles no frontend não é suficiente.

## Transições manuais de status

As transições válidas são verificadas por uma política pura de domínio, reutilizável pelo webhook futuro:

| Status atual | Próximos status permitidos |
|---|---|
| `NEW` | `CONTACTED`, `NO_ANSWER`, `CALLBACK`, `QUALIFIED`, `INVALID` |
| `CONTACTED` | `NO_ANSWER`, `CALLBACK`, `QUALIFIED`, `SALE`, `INVALID` |
| `NO_ANSWER` | `CONTACTED`, `CALLBACK`, `INVALID` |
| `CALLBACK` | `CONTACTED`, `NO_ANSWER`, `QUALIFIED`, `INVALID` |
| `QUALIFIED` | `SALE`, `INVALID` |
| `SALE` | `REFUND` |
| `REFUND` | nenhum |
| `INVALID` | nenhum |

Reenviar o mesmo status atual não cria evento de histórico adicional. Uma transição inválida retorna `422 Unprocessable Entity`.

## Limites desta feature

- Não implementa dashboard, métricas ou frontend de listagem.
- Não altera configurações do dispatcher.
- Não processa webhook nem decide ordenação de eventos externos; a política de transição será reutilizada posteriormente.
