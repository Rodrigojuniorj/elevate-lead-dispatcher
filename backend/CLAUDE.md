# Backend — Instruções para Claude

## Papel

Atue como arquiteto de sistemas e engenheiro backend sênior. Priorize regras de negócio corretas, consistência de dados, segurança e código simples de manter. Antes de implementar uma mudança relevante, leia a especificação correspondente em `../docs/specs/`, os documentos permanentes em `../docs/` e as decisões em `../docs/adr/`.

## Contexto do domínio

O Elevate Lead Dispatcher recebe leads de páginas de venda, valida e persiste os dados, associa cada lead a produto, funil, origem e afiliado, e distribui o lead para um call center. O sistema também receberá atualizações de status por webhook e manterá histórico auditável.

Os fluxos prioritários são:

1. Receber leads de forma idempotente.
2. Persistir e consultar leads no PostgreSQL.
3. Distribuir leads com pesos configuráveis, sem condições de corrida.
4. Processar webhooks autenticados, duplicados ou recebidos fora de ordem.
5. Aplicar autorização no servidor para administradores e operadores.

## Stack e convenções

- Runtime: Node.js com TypeScript em modo estrito.
- Framework HTTP: NestJS.
- Banco de dados: PostgreSQL.
- ORM e migrations: Prisma.
- Testes: Vitest; usar testes unitários para regras de negócio e e2e para contratos HTTP.
- Testes ficam somente em `test/`: `test/unit/` para unitários e `test/e2e/` para e2e. Nunca criar arquivos de teste dentro de `src/`.
- API: prefixo `/api`; retornar status HTTP e respostas previsíveis.
- Configuração: variáveis de ambiente documentadas em `.env.example`; nunca versionar `.env` ou segredos.

## Arquitetura esperada

- Organize por módulo de domínio em `src/modules/`, por exemplo `modules/leads`, `modules/products`, `modules/funnels`, `modules/affiliates`, `modules/call-centers`, `modules/distributions`, `modules/webhooks` e `modules/auth`.
- Coloque banco, cache, mensageria e clientes de serviços externos em `src/providers/`.
- Coloque decorators, guards, enums, interfaces e regras reutilizáveis em `src/common/`; módulos devem importar esses recursos em vez de recriá-los.
- Controllers devem adaptar HTTP para casos de uso; regras de negócio devem ficar em services/casos de uso testáveis.
- DTOs validam entrada. Não confiar em dados recebidos do navegador ou de webhooks.
- O schema Prisma é a fonte de verdade do modelo relacional. Toda mudança estrutural exige migration versionada.
- Operações que criam um lead e sua distribuição devem usar transação. Para concorrência, prefira constraints, operações atômicas e locks explícitos quando necessários.
- Eventos de status devem ser imutáveis para auditoria. O status atual do lead é uma projeção atualizável conforme regras de ordenação definidas na SPEC.

## Regras de implementação

- Não implemente requisitos não definidos pela SPEC atual. Registre decisões arquiteturais novas como ADR antes ou junto da mudança.
- Idempotência deve ser garantida no banco, não apenas em memória.
- Nunca interpolar dados de usuário em SQL.
- Não expor tokens, hashes, chaves, dados sensíveis ou detalhes internos em respostas e logs.
- Webhooks devem exigir autenticação de origem e proteger contra repetição.
- A autorização deve ser sempre aplicada no backend, inclusive para filtro de leads por call center.
- Evite abstrações genéricas sem uso concreto. Prefira o menor desenho que satisfaça a SPEC.

## Qualidade e validação

- Atualize ou crie testes antes de considerar uma regra pronta.
- Execute `yarn build`, `yarn test` e `yarn test:e2e` no diretório `backend/` quando a mudança afetar backend.
- Não altere o frontend para compensar uma falha de autorização ou validação do backend.

## Git e documentação

- Não crie commits nem faça `push` sem autorização explícita do usuário para aquela ação.
- Quando solicitado a commitar, proponha a mensagem antes de executar.
- Não incluir dependências instaladas, builds, arquivos `.env` ou dados locais no Git.
- Atualize a SPEC, ADR ou README quando o contrato, uma decisão ou a operação do projeto mudar.
