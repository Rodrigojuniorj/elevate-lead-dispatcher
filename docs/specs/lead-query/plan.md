# Plano técnico

Criar `src/modules/leads/` com DTOs de query, DTO de atualização, serviço de consulta e serviço de atualização manual. Os controllers somente adaptam HTTP, enquanto uma política pura em `domain/` valida transições de status.

O usuário atual é carregado pelo `JwtAuthGuard`. O serviço deriva um filtro de escopo: para `ADMIN`, nenhum filtro adicional; para `OPERATOR`, `distribution.callCenterId` obrigatório e extraído do usuário. O caller nunca informa o próprio escopo.

As consultas usam o contrato comum `BaseFilterDto` e o helper de paginação tipado, retornando metadados totais para consumo da interface. A ordenação estável é `createdAt DESC, id DESC`; a migration adiciona índices compatíveis com ordenação e filtros de maior uso, incluindo a relação de distribuição por call center.

`PATCH /api/leads/:leadId/status` exige `ADMIN` tanto no guard quanto no serviço. Em uma transação, localiza o lead, valida a transição, atualiza `Lead.status` e insere `LeadStatusHistory`. A mutação não altera dados originais de captura nem a distribuição. Call centers não usam esta rota: eles alteram status exclusivamente pelo webhook autenticado.

Swagger documentará autenticação Bearer, filtros, paginação, respostas de validação, `403`, `404` e `422`.
