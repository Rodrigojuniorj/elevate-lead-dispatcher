# ADR-006 — Inbox e ordenação para webhook de call center

O webhook é autenticado por uma API key exclusiva por call center, fornecida em `X-API-Key`. O banco armazena somente o SHA-256 de uma chave aleatória de alta entropia. A credencial identifica o centro que enviou o evento, eliminando a necessidade de receber `call_center_code` no corpo. O modelo permite várias credenciais ativas durante rotação controlada e revogação sem deploy.

Cada evento recebido é armazenado em uma inbox durável, identificada unicamente por `callCenterId + externalId`. A inbox registra o hash do payload e o resultado da decisão, permitindo repetir uma entrega sem criar outro histórico e detectar a reutilização de um identificador externo com conteúdo distinto.

Eventos são ordenados pelo timestamp fornecido pelo call center. Um advisory lock transacional PostgreSQL por lead serializa webhook e alterações manuais. Apenas um evento estritamente posterior ao último status aceito pode alterar a projeção atual; eventos atrasados, repetidos ou inválidos permanecem auditáveis na inbox.
