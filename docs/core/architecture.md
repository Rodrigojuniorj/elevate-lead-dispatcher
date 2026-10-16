# Arquitetura

O repositório contém `frontend/`, `backend/` e `docs/`. O frontend React/Vite consome a API NestJS no prefixo `/api`. O backend concentra regras de negócio em módulos de domínio, usa Prisma como acesso ao PostgreSQL e mantém migrations versionadas em `backend/prisma/migrations/`. Especificações por funcionalidade ficam exclusivamente em `docs/specs/`.

O backend segue esta organização:

```text
src/
  modules/     # domínios e casos de uso, como auth, leads e distributions
  providers/   # infraestrutura externa, como Prisma, Redis/BullMQ, cache e clientes HTTP
  common/      # recursos reutilizáveis: decorators, guards, enums e autorização
```

O fluxo HTTP é: navegador → controller do módulo → serviço de domínio → provider → PostgreSQL. Controllers adaptam HTTP; services aplicam regras; guards aplicam autenticação e autorização. Nenhuma regra de permissão deve depender somente do frontend.

O PostgreSQL local é disponibilizado pelo Compose. O backend pode ser executado fora de containers usando `DATABASE_URL`.

O domínio de leads mantém catálogos de funis, produtos e afiliados. A associação `FunnelProduct` modela ofertas válidas, permitindo que o mesmo produto participe de múltiplos funis. O endpoint de entrada cria o lead, seu primeiro evento de status e um trabalho durável de distribuição em uma única transação.

O dispatcher usa PostgreSQL como fonte de verdade e Redis/BullMQ para processamento assíncrono. Um publicador recupera trabalhos pendentes, e o worker persiste uma distribuição única por lead usando Smooth Weighted Round Robin sob advisory lock transacional.
