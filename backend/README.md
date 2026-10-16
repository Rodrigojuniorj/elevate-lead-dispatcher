# Elevate Lead Dispatcher API

## Execução local

```bash
yarn install
docker compose up -d postgres redis
yarn prisma migrate deploy
yarn prisma:seed
yarn start:dev
```

A API fica disponível em `http://localhost:3000/api` e o Swagger em `http://localhost:3000/api/docs`.

## Testes

```bash
yarn test
yarn test:e2e
```

Os testes e2e usam `DATABASE_URL_TEST` e `REDIS_URL_TEST`, separados da infraestrutura de desenvolvimento. O Compose cria `elevate_lead_dispatcher_test` em uma inicialização nova; para um volume existente, crie o banco uma única vez antes de executar a suíte.

## Entrada de leads

`POST /api/leads` aceita leads públicos com `Idempotency-Key` obrigatório e rate limit de 30 requisições por minuto por IP. O endpoint normaliza o payload, valida catálogo ativo e cria lead, evento inicial de status e trabalho durável de distribuição na mesma transação.

Após o commit, um publicador envia o trabalho ao Redis/BullMQ. O worker distribui o lead entre call centers ativos usando Smooth Weighted Round Robin. A resposta `201` confirma a persistência; a atribuição acontece de forma assíncrona. Repetições idempotentes retornam `200` e não criam outro job.

Redis usa persistência local pelo volume `redis-data`. Em falhas transitórias, o job permanece pendente e o worker repete o processamento com backoff.

## Envio manual de leads

Com a API em execução e as seeds aplicadas, envie leads de teste com:

```powershell
$env:LEAD_COUNT=10
yarn test:leads
```

O script usa o catálogo inicial, gera e-mails e `Idempotency-Key` únicos e exibe o resumo por status HTTP. As variáveis opcionais são `LEADS_API_URL`, `LEAD_CONCURRENCY` e `LEAD_INTERVAL_MS`. Por padrão, ele envia sequencialmente com 2,1 segundos entre requisições para respeitar o limite público de 30 requisições por minuto por IP. Reduzir o intervalo ou aumentar concorrência pode retornar `429` intencionalmente.

Uma evolução posterior substituirá a entrada pública por autenticação de origem com API keys armazenadas como hash, rotação de chaves e desativação sem deploy.

## Índices

`leads` possui índices para criação, status com data, associação produto/funil, afiliado e origem. `funnel_products` mantém unicidade da oferta e índice reverso por produto. Esses índices atendem a consultas paginadas e filtros administrativos sem duplicar identificadores de catálogo no lead.
