# Convenções

- Código, nomes de tabelas, colunas, enums, variáveis de ambiente e contratos HTTP usam inglês.
- TypeScript opera em modo estrito. Imports ESM locais usam extensão `.js`.
- Módulos Nest são organizados por domínio em `src/modules/<feature>/`. DTOs validam entrada; controllers não contêm regras de negócio.
- Todo endpoint HTTP é documentado no Swagger; DTOs de entrada, saída e erro usam decorators OpenAPI e não expõem dados sensíveis.
- Providers de infraestrutura externa ficam em `src/providers/`; cache, banco, mensageria e clientes de terceiros não pertencem a módulos de domínio.
- Decorators, guards, enums, interfaces e regras reutilizáveis ficam em `src/common/`. Não duplicar esses recursos dentro de módulos.
- O schema Prisma é a fonte de verdade do modelo. Toda alteração de estrutura inclui migration.
- Respostas não expõem hashes, tokens internos, segredos ou detalhes de infraestrutura.
- Variáveis obrigatórias ficam documentadas em `.env.example`; arquivos `.env` não são versionados.
- Commits e push exigem autorização explícita do usuário.
- No frontend, páginas ficam em `src/pages/`, comunicação por feature em `src/apis/`, clientes compartilhados em `src/clients/`, estado transversal em `src/contexts/`, componentes em `src/components/` e tipos em `src/types/`.
- Cada feature possui `spec.md`, `plan.md` e `tasks.md`; `tasks.md` é ordenado, referencia requisitos e registra dependência e resultado esperado por tarefa.
- Testes ficam exclusivamente em `backend/test/`: `test/unit/` para regras isoladas e `test/e2e/` para contratos HTTP.
