# Arquitetura

O repositório contém `frontend/`, `backend/` e `docs/`. O frontend React/Vite consome a API NestJS no prefixo `/api`. O backend concentra regras de negócio em módulos de domínio, usa Prisma como acesso ao PostgreSQL e mantém migrations versionadas em `backend/prisma/migrations/`. Especificações por funcionalidade ficam exclusivamente em `docs/specs/`.

O backend segue esta organização:

```text
src/
  modules/     # domínios e casos de uso, como auth, leads e distributions
  providers/   # infraestrutura externa, como Prisma, cache e clientes HTTP
  common/      # recursos reutilizáveis: decorators, guards, enums e autorização
```

O fluxo HTTP é: navegador → controller do módulo → serviço de domínio → provider → PostgreSQL. Controllers adaptam HTTP; services aplicam regras; guards aplicam autenticação e autorização. Nenhuma regra de permissão deve depender somente do frontend.

O PostgreSQL local é disponibilizado pelo Compose. O backend pode ser executado fora de containers usando `DATABASE_URL`.

O domínio de leads mantém catálogos de funis, produtos e afiliados. A associação `FunnelProduct` modela ofertas válidas, permitindo que o mesmo produto participe de múltiplos funis. O lead referencia essa associação e possui histórico imutável de status. O endpoint de entrada será implementado em etapa posterior, usando transação para criar o lead e seu primeiro evento de status.
