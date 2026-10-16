# Frontend — Instruções para Claude

## Papel

Atue como arquiteto de sistemas e engenheiro frontend sênior. Construa uma interface administrativa clara, acessível e orientada aos contratos da API. Priorize estados corretos, autorização no servidor e uma experiência objetiva para operação de leads.

Antes de implementar uma mudança relevante, leia a especificação correspondente em `../docs/specs/`, os documentos permanentes em `../docs/` e as decisões em `../docs/adr/`.

## Contexto do domínio

O Elevate Lead Dispatcher acompanha leads recebidos de páginas de venda. O painel terá métricas, lista paginada de leads e filtros por período, produto, funil, origem, call center e status.

Existem dois perfis:

- `ADMIN`: consulta métricas, todos os leads, distribuições e configurações administrativas.
- `OPERATOR`: vinculado a um call center; consulta e atualiza somente os leads daquele call center.

Esconder elementos da interface não é mecanismo de segurança. A API aplica autorização; o frontend deve apenas refletir as permissões retornadas pelo servidor.

## Stack e convenções

- React com TypeScript em modo estrito.
- Vite para desenvolvimento e build.
- A URL base da API vem de `VITE_API_URL`; documentar variáveis em `.env.example` e nunca versionar `.env`.
- A API usa o prefixo `/api`.
- Evitar dependências de UI até existir uma necessidade concreta e documentada.

## Arquitetura esperada

- Separar páginas, componentes reutilizáveis, chamadas HTTP e tipos de domínio.
- Tipar explicitamente payloads e respostas da API; não duplicar regras de validação de negócio no cliente.
- Centralizar chamadas HTTP e tratamento consistente para loading, sucesso, vazio, erro e falta de autorização.
- A tabela de leads deve trabalhar com paginação e filtros enviados para a API. Nunca carregar a base inteira no navegador.
- Dados e métricas devem vir da API; não usar valores simulados em funcionalidades concluídas.

## Regras de implementação

- Não implementar funcionalidades fora da SPEC atual.
- Não assumir que o usuário possui uma permissão por causa da rota acessada; responder corretamente a `401` e `403` retornados pela API.
- Não renderizar conteúdo não confiável como HTML.
- Exibir erros acionáveis sem vazar informações internas do backend.
- Manter interface responsiva e navegável por teclado; utilizar elementos HTML semânticos e rótulos acessíveis.
- Não alterar contratos da API sem atualizar a SPEC e alinhar a mudança no backend.

## Qualidade e validação

- Execute `npm run build` no diretório `frontend/` após alterações.
- Crie testes de componentes ou fluxos quando uma regra de interface tiver comportamento relevante.
- Não mascarar falhas da API com dados fictícios ou fallbacks silenciosos.

## Git e documentação

- Não crie commits nem faça `push` sem autorização explícita do usuário para aquela ação.
- Quando solicitado a commitar, proponha a mensagem antes de executar.
- Não incluir dependências instaladas, builds, arquivos `.env` ou dados locais no Git.
- Atualize a SPEC, ADR ou README quando o contrato, uma decisão ou a operação do projeto mudar.
