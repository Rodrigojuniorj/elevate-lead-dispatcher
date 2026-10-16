# Plano técnico

O módulo `src/modules/leads/` conterá controller, DTOs, serviço e regras de domínio. O controller recebe `POST /api/leads`, aplica validação global e expõe o contrato no Swagger. O serviço normaliza o payload, resolve os códigos de catálogo e executa a criação dentro de transação Prisma.

`Funnel`, `Product`, `FunnelProduct`, `Affiliate`, `Lead` e `LeadStatusHistory` compõem o modelo. `FunnelProduct` é a associação muitos-para-muitos entre produto e funil, possui estado próprio e impede que o lead referencie uma combinação inválida. O lead referencia a associação, preservando acesso ao produto e ao funil sem duplicar os dois identificadores. `Affiliate` é opcional no lead.

`Lead` usa UUID, armazena contato, origem, campanha, UTM, `LeadStatus`, `idempotencyKey` única e `requestHash`. Os status são `NEW`, `CONTACTED`, `NO_ANSWER`, `CALLBACK`, `QUALIFIED`, `SALE`, `REFUND` e `INVALID`. O histórico registra status, origem do evento e instante de ocorrência, sem campos de atualização.

A migration cria os índices de filtros previstos: data de criação, status, produto, funil, afiliado e origem. A chave de idempotência é protegida por constraint única no banco. O índice único da associação protege o par produto/funil, e seu índice reverso otimiza filtros por produto. Regras puras em `src/modules/leads/domain/` permitem testar associação ativa, status inicial e igualdade de hash sem banco.

Seeds de catálogo ficam em `prisma/seeds/` e são idempotentes. Depois da persistência bem-sucedida, o caso de uso chamará a porta do dispatcher; a implementação concreta de distribuição, concorrência e pesos pertence à feature `dispatcher`. O webhook atualizará somente status e histórico, em uma feature própria, sem alterar os dados originais do lead.
