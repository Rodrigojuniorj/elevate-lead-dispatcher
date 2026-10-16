# ADR-003 — Outbox transacional para distribuição de leads

## Contexto

O lead é persistido no PostgreSQL, enquanto a distribuição é processada por Redis/BullMQ. Uma publicação direta após o commit pode falhar e deixar um lead sem destino.

## Decisão

- Criar `DistributionJob` na mesma transação do lead.
- Tratar PostgreSQL como fonte de verdade do trabalho pendente.
- Publicar no BullMQ após o commit com `DistributionJob.id` como `jobId` estável.
- Reexaminar trabalhos não publicados periodicamente; publicação repetida com o mesmo ID não cria job duplicado.
- Remover o job BullMQ apenas após sucesso, preservando o registro PostgreSQL para auditoria.

## Consequências

O endpoint não depende da disponibilidade imediata do Redis para confirmar o lead. O sistema adiciona uma tabela e um processo de publicação, mas evita perder distribuições entre banco e fila.
