# ADR-001: Monorepo com fundação síncrona

## Status

Aceita.

## Contexto

O repositório evoluirá para incluir frontend, API, banco relacional, distribuição de leads e tratamento de concorrência. O maior risco técnico inicial está na consistência do fluxo de leads, não na comunicação assíncrona. A primeira etapa precisa ser pequena, executável e fácil de testar.

## Decisão

1. Manter frontend e backend no mesmo repositório, em `frontend/` e `backend/`.
2. Usar React com Vite no frontend e NestJS com TypeScript no backend.
3. Iniciar o fluxo de negócio de forma síncrona via HTTP e PostgreSQL.
4. Não introduzir mensageria na fundação. Essa necessidade poderá ser reavaliada depois que `POST /api/leads`, idempotência, distribuição e testes de concorrência estiverem implementados.
5. Manter especificações por feature em `docs/specs/` e decisões arquiteturais em `docs/adr/`.

## Consequências

### Positivas

- Menor quantidade de serviços e variáveis de falha no início.
- Desenvolvimento e testes locais mais rápidos.
- Transações e constraints do PostgreSQL podem proteger a criação idempotente do lead e sua distribuição inicial.
- Frontend e backend evoluem de forma independente, mas com um único histórico Git.

### Negativas

- Processamentos lentos não devem permanecer no ciclo HTTP quando forem introduzidos.
- Um aumento de volume poderá exigir mensageria, worker e padrão transactional outbox em uma evolução futura.
- Cada projeto possui temporariamente seu próprio `package.json` e ciclo de instalação.

## Alternativas consideradas

### Mensageria desde o início

Rejeitada para a fundação. Mensageria pode ser justificável para absorver picos, desacoplar processamento ou integrar múltiplos consumidores. Nenhuma dessas necessidades está implementada ainda; adicioná-la agora aumentaria a superfície operacional sem validar a regra de negócio crítica.

### Monorepo com workspace de dependências compartilhado

Adiada. Não há código compartilhado nem uma necessidade atual de instalar dependências por um comando raiz. Um workspace poderá ser criado se surgirem contratos TypeScript ou bibliotecas comuns.

## Reavaliação

Criar uma nova ADR caso a decisão seja migrar o processamento de distribuição ou integrações para assíncrono. A ADR deve registrar gatilho, garantia de entrega, estratégia de idempotência do consumidor, observabilidade e plano de falha/reprocessamento.
