# Elevate Lead Dispatcher

Aplicação para receber leads, associá-los ao catálogo comercial, distribuí-los entre operações de atendimento e acompanhar a evolução de cada atendimento até a venda, reembolso ou invalidação.

O foco do projeto é o caminho crítico: o lead entra uma vez, fica rastreável, recebe um destino de forma concorrente e pode ser atualizado por eventos externos sem perder histórico.

## Visão geral

```text
Landing page / origem externa
            │
            │ POST /api/leads + Idempotency-Key
            ▼
      PostgreSQL ── Lead + histórico NEW + DistributionJob
            │                         │
            │                         ▼
            │                   Redis / BullMQ
            │                         │
            │                         ▼
            └────────────────── Dispatcher ──► Distribution / Call center

Call center ── POST /api/webhooks/callcenter ──► Inbox auditável + histórico de status
                                                          │
                                                          ▼
                                              Dashboard React / consultas autenticadas
```

O repositório é dividido em três áreas:

```text
frontend/   React + Vite
backend/    NestJS + Prisma + PostgreSQL + BullMQ
docs/       regras permanentes, ADRs e especificações por funcionalidade
```

## Stack e escolhas

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| Frontend | React, TypeScript e Vite | Interface pequena, rápida de iterar e com tipagem compartilhável por contrato HTTP. |
| API | NestJS e TypeScript | Módulos, guards, DTOs, Swagger e injeção de dependências organizam bem os domínios. |
| Persistência | PostgreSQL e Prisma | Relacionamentos, constraints, transações e migrations versionadas são centrais neste caso. |
| Processamento assíncrono | Redis e BullMQ | Separa a confirmação do recebimento do lead da distribuição e permite retry do trabalho. |
| Senhas | Argon2id | Hash de senha resistente a ataques de força bruta. |

Kafka não foi introduzido. Para este volume e para um único tipo de trabalho assíncrono, Redis/BullMQ reduz a complexidade operacional sem mudar a fronteira do domínio. A troca por outro broker é possível porque a decisão de distribuição está no módulo de dispatcher, não nos controllers.

## Executar tudo com Docker Compose

### Pré-requisitos

- Docker Desktop com Docker Compose

Na raiz do repositório, crie a configuração local.

**PowerShell**

```powershell
Copy-Item .env.production.example .env.production
```

**macOS, Linux ou Git Bash**

```bash
cp .env.production.example .env.production
```

Edite `.env.production` antes de continuar. `POSTGRES_PASSWORD` deve usar caracteres seguros para URL, pois também compõe a conexão do PostgreSQL; `JWT_ACCESS_SECRET` deve ter pelo menos 32 caracteres e ser exclusivo do ambiente.

Depois, um único comando constrói e inicia banco, Redis, migrations, seed inicial, API e interface:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

O frontend fica em `http://localhost:8080`; a API e o Swagger passam pelo mesmo endereço, em `http://localhost:8080/api` e `http://localhost:8080/api/docs`. PostgreSQL e Redis ficam somente na rede interna do Compose.

Para encerrar os containers sem apagar os dados persistidos:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

## Desenvolvimento com hot reload

Para desenvolver fora dos containers de aplicação, você precisa de Node.js 22 e Corepack com Yarn 4.

```powershell
cd backend
Copy-Item .env.example .env
yarn install
```

Edite `backend/.env` e defina um `JWT_ACCESS_SECRET` com ao menos 32 caracteres. Em seguida, na raiz, suba apenas as dependências:

```powershell
docker compose up -d
```

O Compose de desenvolvimento sobe PostgreSQL, Redis e o bootstrap do banco. Em um banco já populado, o seed não sobrescreve dados.

Em terminais separados:

```powershell
cd backend
yarn start:dev
```

```powershell
cd frontend
yarn install
yarn dev
```

| Serviço | Endereço |
| --- | --- |
| Interface | `http://localhost:5173` |
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/api/docs` |

### Contas locais

As contas abaixo existem apenas para desenvolvimento local:

| Perfil | E-mail | Senha | Escopo |
| --- | --- | --- | --- |
| ADMIN | `admin@elevate.local` | `ElevateAdmin!2026` | Todos os leads e métricas. |
| OPERATOR | `operator.a@elevate.local` | `OperatorA!2026` | `CALL-CENTER-A` |
| OPERATOR | `operator.b@elevate.local` | `OperatorB!2026` | `CALL-CENTER-B` |
| OPERATOR | `operator.c@elevate.local` | `OperatorC!2026` | `CALL-CENTER-C` |

As chaves de webhook locais também são semeadas para facilitar a demonstração. Elas nunca devem ser usadas fora do ambiente de desenvolvimento:

| Call center | `X-API-Key` |
| --- | --- |
| `CALL-CENTER-A` | `elevate-webhook-call-center-a-2026` |
| `CALL-CENTER-B` | `elevate-webhook-call-center-b-2026` |
| `CALL-CENTER-C` | `elevate-webhook-call-center-c-2026` |

## API principal

| Método | Rota | Uso |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Cria uma sessão JWT por e-mail e senha. |
| `GET` | `/api/auth/me` | Restaura o usuário autenticado. |
| `POST` | `/api/leads` | Recebe um lead público de uma origem externa. |
| `GET` | `/api/leads` | Lista leads paginados e filtrados dentro do escopo do usuário. |
| `GET` | `/api/leads/:leadId` | Retorna o detalhe e histórico operacional. |
| `PATCH` | `/api/leads/:leadId/status` | Atualização manual exclusiva de `ADMIN`. |
| `GET` | `/api/dashboard/metrics` | Métricas filtradas, exclusivo de `ADMIN`. |
| `POST` | `/api/webhooks/callcenter` | Recebe atualização externa autenticada por API key. |

Swagger documenta DTOs, headers, respostas e autenticação Bearer em `http://localhost:3000/api/docs`.

## Recebimento e idempotência

`POST /api/leads` recebe `name`, `email`, `phone`, `productCode`, `funnelCode`, `source`, campanha, afiliado e UTM opcionais. O cabeçalho `Idempotency-Key` é obrigatório.

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: landing-page-0001" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "+5511999999999",
    "productCode": "nutralean",
    "funnelCode": "vsl-01",
    "affiliateCode": "affiliate-999",
    "source": "facebook",
    "campaign": "campaign-123",
    "utm": { "source": "facebook", "medium": "cpc" }
  }'
```

O payload é normalizado antes de um SHA-256 determinístico ser calculado. A primeira entrega cria o lead e responde `201`; uma repetição com a mesma chave e mesmo hash responde `200` com o mesmo `leadId`; a reutilização da chave com conteúdo diferente responde `409`.

A unicidade da chave também está no banco. Se duas requisições idênticas chegam em paralelo, a colisão da constraint é tratada relendo o registro vencedor. Não há duas criações para a mesma chave.

Validações de DTO, catálogo ativo e combinação produto/funil retornam `400` ou `422` conforme o problema. O endpoint público possui limite de 30 requisições por minuto por IP.

## Modelo de dados

O modelo preserva o contexto comercial da captura sem duplicar códigos de catálogo no lead:

- `Funnel` e `Product` se relacionam por `FunnelProduct`. Um produto pode fazer parte de vários funis, e um lead aponta para uma associação válida.
- `Affiliate` é opcional e identificado por código estável.
- `Lead` mantém dados de contato, tracking, status atual, chave de idempotência e hash do pedido.
- `LeadStatusHistory` é imutável; o primeiro evento é sempre `NEW`.
- `DistributionJob` é a outbox durável para distribuição.
- `Distribution` registra o destino final, estratégia e pesos utilizados.
- `CallCenterWebhookEvent` é a inbox auditável dos eventos recebidos.
- `CallCenterWebhookCredential` guarda somente o hash de cada API key.

Migrations ficam em `backend/prisma/migrations/`. O schema Prisma é a fonte de verdade do modelo.

### Índices

Os índices existem para as consultas executadas pela aplicação, não por precaução genérica:

| Índice | Consulta atendida |
| --- | --- |
| `leads(created_at, id)` | Paginação estável por criação. |
| `leads(status, created_at, id)` | Filtro por status e período. |
| `leads(funnel_product_id, created_at, id)` | Filtros de produto e funil. |
| `leads(source, created_at, id)` | Filtro de origem. |
| `distributions(call_center_id, assigned_at)` | Escopo de operador e filtros de destino. |
| `distribution_jobs(status, published_at)` | Recuperação de jobs pendentes de publicação. |
| `lead_status_history(lead_id, occurred_at)` | Histórico cronológico e ordenação de webhooks. |
| `call_center_webhook_events(call_center_id, external_id)` único | Deduplicação de eventos externos. |

## Distribuição assíncrona

Cada criação inédita grava, na mesma transação PostgreSQL:

1. o `Lead` com status `NEW`;
2. seu primeiro `LeadStatusHistory`;
3. um `DistributionJob` pendente.

Após o commit, o publicador tenta inserir o job no BullMQ com o próprio ID do `DistributionJob` como `jobId`. Um processo periódico revisita jobs ainda não publicados a cada cinco segundos. Se Redis estiver indisponível, o lead continua persistido e o trabalho não se perde.

O worker usa **Smooth Weighted Round Robin**. Os pesos iniciais são A=50, B=30 e C=20. Centros inativos ou desabilitados ficam fora da seleção. A decisão toma um `pg_advisory_xact_lock` transacional global antes de ler e atualizar os pesos correntes; por isso dois workers não escolhem com base no mesmo estado.

Em uma carga de 100 leads novos e elegíveis, a distribuição esperada é 50 para A, 30 para B e 20 para C. O registro `Distribution` guarda a decisão para auditoria. Falhas do job usam backoff progressivo de 1, 5, 15 e até 60 minutos.

Para disparar carga local:

```powershell
cd backend
$env:LEAD_COUNT=100
$env:LEAD_CONCURRENCY=10
$env:LEAD_INTERVAL_MS=0
yarn test:leads
```

O limite público de entrada pode responder `429` nesse cenário. Para observar somente o dispatcher, mantenha o intervalo padrão ou ajuste temporariamente o limite no ambiente local.

## Webhook do call center

O call center envia um evento para `POST /api/webhooks/callcenter`.

```json
{
  "lead_id": "8f3c7c2e-5b1a-4d0e-9a67-2f4c1b7e9d10",
  "external_id": "abc123",
  "status": "contacted",
  "timestamp": "2026-10-18T14:00:00.000Z"
}
```

`external_id` identifica o evento no sistema do call center, não o lead. A API key no cabeçalho `X-API-Key` identifica o call center de origem; o corpo não aceita um call center informado pelo cliente.

O processamento segue esta ordem:

1. autentica a credencial ativa e resolve o call center;
2. confirma que o lead foi distribuído para esse mesmo centro;
3. procura a inbox pela combinação `callCenterId + externalId`;
4. toma um advisory lock do lead;
5. compara timestamp e valida a transição de status;
6. registra a inbox, e somente se aplicável, atualiza o lead e cria o histórico.

Resultados bem-sucedidos incluem `outcome`:

| Outcome | Significado |
| --- | --- |
| `APPLIED` | O status e o histórico foram atualizados. |
| `IGNORED_STALE` | Evento chegou com timestamp menor ou igual ao último aceito. |
| `IGNORED_UNCHANGED` | O evento é mais novo, mas traz o status já atual. |
| `REJECTED_INVALID_TRANSITION` | A transição não é permitida; a API responde `422`. |

Reentregar o mesmo `external_id` com o mesmo payload devolve o resultado gravado. Reutilizar o mesmo identificador com conteúdo diferente responde `409`. Isso torna a entrega segura para tentativas automáticas do call center.

O timestamp não pode estar mais de cinco minutos no futuro. Um evento `CONTACTED` posterior a `SALE` é mantido na inbox como `IGNORED_STALE`; ele não faz o lead regredir.

### Simulação pela interface

O operador não possui acesso à rota de atualização manual. No ambiente local, ele pode usar **Simular retorno** na tabela. A interface envia apenas o status escolhido para uma rota JWT protegida; o servidor cria `external_id` e timestamp, percorre o mesmo serviço do webhook e devolve tanto o evento simulado quanto a resposta. A tela mostra o evento enviado, o `outcome` e o status final. A simulação fica indisponível em produção e nenhuma API key chega ao navegador.

## Autenticação, autorização e dashboard

O login usa e-mail e senha com hash Argon2id. O JWT contém apenas `sub`; em cada requisição autenticada, a API busca o usuário atual no banco para respeitar alterações de perfil, vínculo com call center e inativação.

- `ADMIN` consulta todos os leads, vê métricas, filtra por call center e pode alterar o status manualmente.
- `OPERATOR` vê apenas leads distribuídos ao seu call center. O escopo é aplicado nas queries do backend, não só na interface.
- Atualizações reais de atendimento do call center chegam via webhook; a simulação local segue o mesmo fluxo sem expor segredo.

O dashboard calcula no backend total de leads, leads de hoje, distribuídos, pendentes, vendas e conversão. Métricas e tabela usam os mesmos filtros. “Hoje” usa `America/Sao_Paulo`; conversão é `SALE / total filtrado`, retornando zero quando não há leads.

## Segurança aplicada

- DTOs com `class-validator`, `ValidationPipe` global, whitelist e rejeição de campos desconhecidos.
- Configuração validada por Zod na inicialização.
- Senhas em Argon2id; hashes, tokens e chaves não são retornados pelas respostas.
- JWT Bearer curto, sem refresh token nesta fase; o frontend usa `sessionStorage` por aba.
- Guards de JWT, roles e escopo de call center no backend.
- Rate limit global, limite reforçado no login e no recebimento público de leads.
- Prisma e parâmetros tipados para impedir interpolação manual de SQL nas consultas de aplicação.
- API keys de webhook persistidas apenas como SHA-256, com suporte a múltiplas credenciais por centro para rotação e revogação.
- CORS restrito à origem configurada em `FRONTEND_URL`.

CSRF não é um vetor principal nesta etapa porque a autenticação da interface usa Bearer token em header, e não cookie automaticamente enviado pelo navegador. Em produção, o armazenamento e a estratégia de sessão devem ser revisitados junto com a política de XSS e CSP.

## Testes e validação

No backend:

```powershell
cd backend
yarn prisma:generate
yarn build
yarn lint
yarn test
yarn test:e2e
```

No frontend:

```powershell
cd frontend
yarn build
yarn lint
yarn test
```

Os testes unitários cobrem regras de idempotência, transições de status, timestamp de webhook, guard de API key, distribuição e configuração. Os e2e usam `DATABASE_URL_TEST` e `REDIS_URL_TEST`, isolados do ambiente local, e cobrem entrada de lead, repetição idempotente, 100 distribuições concorrentes, escopo por perfil, webhook duplicado, eventos fora de ordem, credencial revogada e simulação local.

## Escalabilidade

O desenho atual suporta crescimento inicial sem antecipar infraestrutura desnecessária. Para volumes maiores, a evolução seria gradual:

1. medir consultas e usar os índices existentes antes de criar novos;
2. particionar `leads`, histórico e inbox por data quando a manutenção de índices e retenção justificarem;
3. separar API, publicador e workers em processos independentes, aumentando workers conforme a fila;
4. manter múltiplas réplicas da API, pois o estado crítico está em PostgreSQL e Redis;
5. mover métricas mais caras para agregados materializados ou tabelas de leitura;
6. revisar o lock global do dispatcher e, se necessário, particionar o estado de distribuição sem mudar o contrato externo;
7. adicionar observabilidade: métricas de fila, idade de jobs, falhas de webhook, latência, tracing e alertas.

O PostgreSQL continua sendo a fonte de verdade para leads, distribuição e auditoria. Redis acelera processamento, mas não é a única cópia de uma decisão de negócio.

## Limitações assumidas e próximos passos

- Não existe CRUD administrativo de produtos, funis, afiliados, call centers, pesos ou usuários; o catálogo e os acessos locais vêm de seed.
- A entrada pública ainda não autentica a origem. A próxima etapa é uma API key por origem, armazenada em hash, com rotação e revogação.
- Não há refresh token, logout com revogação ou recuperação de senha.
- Não há entrega do lead para um sistema externo de call center; a distribuição é registrada internamente, como fonte de trabalho da operação.
- O webhook usa API keys. HMAC com assinatura de payload e timestamp é uma evolução possível quando o contrato com os parceiros estiver definido.
- A simulação de webhook é apenas ferramenta local de demonstração e é bloqueada em produção.
- O Compose de produção é uma forma autocontida de executar o sistema. Para um ambiente público, ainda faltam TLS no proxy de borda, gestão externa de segredos, backups, observabilidade e uma estratégia de deploy.
- Falta monitoramento operacional, retenção de dados, política de LGPD, auditoria administrativa detalhada e deploy automatizado.

## Documentação de engenharia

- [Arquitetura](docs/core/architecture.md)
- [Convenções](docs/core/conventions.md)
- [Regras de negócio](docs/core/business-rules.md)
- [Decisões arquiteturais](docs/adr)
- [Especificações por funcionalidade](docs/specs)

As SPECs descrevem o comportamento de cada feature; os ADRs registram decisões duradouras, como outbox transacional, Smooth Weighted Round Robin, métricas no servidor e inbox de webhook.

## Uso de IA no desenvolvimento

O Codex foi usado como apoio para decompor a entrega em especificações, planos e tarefas, propor estruturas de módulo, revisar implementações e acelerar a escrita de testes e documentação. A responsabilidade pelas decisões e pelo código permaneceu no desenvolvimento.

O fluxo adotado foi incremental: definir a regra, implementar uma fatia pequena, revisar, executar build/lint/testes e só então seguir para a próxima. As mudanças foram separadas em commits de backend, frontend e documentação.

Alguns exemplos de revisão ativa durante o trabalho:

- a ideia inicial de uma API key global de webhook foi substituída por credenciais individuais por call center, persistidas somente como hash;
- o campo de call center foi removido do payload público do webhook, porque a identidade já vem da chave autenticada;
- a atualização manual de status foi restringida a `ADMIN`; o operador demonstra o fluxo externo por meio de uma simulação que reutiliza o processamento do webhook;
- o bootstrap do banco foi separado em um serviço one-shot para evitar que seeds reescrevam um ambiente já populado;
- propostas e código foram confrontados com migrations, testes unitários, e2e, build, lint e validação do Compose antes de serem mantidos.

Esse histórico, os arquivos `CLAUDE.md`, `AGENTS.md`, as SPECs e os ADRs ficam versionados para tornar o processo de engenharia verificável.
