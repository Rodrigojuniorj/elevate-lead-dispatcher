# Recebimento de leads

## Objetivo

Receber leads de páginas de venda com dados rastreáveis, referências consistentes, proteção contra duplicidade e encaminhamento confiável para o fluxo de distribuição.

## Requisitos

- **R-01:** cada lead pertence a uma associação ativa e válida entre produto e funil; produtos podem participar de vários funis.
- **R-02:** o lead pode ter um afiliado opcional, identificado por código estável.
- **R-03:** o lead mantém dados de contato, origem, campanha e parâmetros UTM.
- **R-04:** todo lead possui status atual e histórico imutável de eventos de status.
- **R-05:** tentativas repetidas de criação são identificadas por uma `Idempotency-Key` e pelo hash do payload.
- **R-06:** o endpoint é documentado no Swagger com DTOs de entrada, saída e erro.
- **R-07:** após a criação, o lead fica disponível para distribuição e acompanhamento de status.

## Contrato HTTP

`POST /api/leads` recebe leads de fontes externas. O header `Idempotency-Key` é obrigatório e o corpo usa códigos estáveis para referências comerciais:

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "+5511999999999",
  "productCode": "nutralean",
  "funnelCode": "vsl-01",
  "affiliateCode": "affiliate-999",
  "source": "facebook",
  "campaign": "campaign-123",
  "utm": {
    "source": "facebook",
    "medium": "cpc",
    "campaign": "campaign-123",
    "content": "ad-01",
    "term": "weight-loss"
  }
}
```

Em caso de sucesso, responde `201` com:

```json
{
  "success": true,
  "leadId": "8f3c7c2e-5b1a-4d0e-9a67-2f4c1b7e9d10"
}
```

## Fluxo de criação

1. O controller valida header e DTO, e publica o contrato no Swagger.
2. O serviço localiza uma associação `FunnelProduct` ativa pelos códigos informados e, se houver, o afiliado ativo.
3. O payload normalizado é transformado em hash determinístico.
4. Em uma transação, o serviço cria o lead, o status inicial `NEW` e o primeiro evento de `LeadStatusHistory` com origem `SYSTEM`.
5. A constraint única da chave de idempotência impede duplicação concorrente. Reenvio com mesmo hash retorna o mesmo resultado; reutilização da chave com outro hash retorna `409 Conflict`.
6. Após persistir, o lead é entregue ao dispatcher, que registra a distribuição para um call center. O dispatcher é implementado e documentado na feature própria.

## Catálogos e evolução operacional

- Seeds criam um catálogo local mínimo de funis, produtos, associações produto/funil e afiliados para desenvolvimento e testes manuais.
- `FunnelProduct` permite ativar ou desativar uma oferta sem apagar referências históricas de leads.
- O histórico de status recebe atualizações da operação e do webhook de call center. O webhook tem sua própria autenticação, ordenação e regras de idempotência.
- A interface administrativa consulta leads com filtros por período, produto, funil, origem, call center e status, usando paginação.
