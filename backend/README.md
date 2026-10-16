# Elevate Lead Dispatcher API

## Execução local

```bash
yarn install
docker compose up -d postgres
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

Os testes e2e usam `DATABASE_URL_TEST`, separado do banco de desenvolvimento. O Compose cria `elevate_lead_dispatcher_test` em uma inicialização nova; para um volume existente, crie o banco uma única vez antes de executar a suíte.

## Entrada de leads

`POST /api/leads` aceita leads públicos com `Idempotency-Key` obrigatório e rate limit de 30 requisições por minuto por IP. O endpoint normaliza o payload, valida catálogo ativo e cria lead mais evento inicial de status na mesma transação.

Uma evolução posterior substituirá a entrada pública por autenticação de origem com API keys armazenadas como hash, rotação de chaves e desativação sem deploy.

## Índices

`leads` possui índices para criação, status com data, associação produto/funil, afiliado e origem. `funnel_products` mantém unicidade da oferta e índice reverso por produto. Esses índices atendem a consultas paginadas e filtros administrativos sem duplicar identificadores de catálogo no lead.
