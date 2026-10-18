# Plano técnico

## Persistência

`CallCenterWebhookEvent` é uma inbox imutável: call center, lead, `externalId`, status recebido, status resultante, instante, hash normalizado, resultado e processamento. A unicidade por call center e identificador externo protege deduplicação entre processos concorrentes.

`LeadStatusHistory` continua sendo o histórico de mudanças aplicadas. A inbox preserva também entregas ignoradas e rejeitadas.

## Segurança e validação

Cada `CallCenterWebhookCredential` associa um call center a um hash SHA-256 de API key aleatória de alta entropia. O guard lê `X-API-Key`, consulta somente o hash e anexa a identidade autenticada do call center à requisição. O DTO documentado no Swagger valida o contrato antes do processamento.

O SHA-256 do payload usa `external_id` sem espaços externos, status interno e timestamp ISO. Assim, uma entrega repetida é distinguida de uma reutilização incompatível do mesmo identificador externo.

## Transação e ordenação

O serviço confirma o centro ativo, consulta a inbox e abre transação PostgreSQL. Dentro dela, toma `pg_advisory_xact_lock` determinístico pelo ID do lead — o mesmo helper usado pela atualização manual.

Sob o lock, confirma a distribuição, encontra o último status aceito e decide: atrasado, inalterado, transição inválida ou aplicável. A inbox, o histórico e a projeção de status são gravados atomica e consistentemente.

Em colisão da constraint da inbox, o evento é relido: hash igual devolve o resultado armazenado; hash diferente devolve conflito.

## Evolução

A criação local de uma credencial gera uma chave aleatória e imprime seu valor apenas uma vez; o banco armazena somente o hash. O modelo já permite múltiplas credenciais por call center para rotação e revogação. Esta feature não inclui fila, JWT, interface ou callback.

Para provisionar uma credencial localmente, execute `yarn webhook:key:create CALL-CENTER-A` dentro de `backend/` e entregue a chave exibida somente ao call center correspondente.

Para demonstrar o fluxo pela interface local, um endpoint de simulação protegido por JWT fica disponível somente fora de produção. Ele aceita um status interno de um `OPERATOR`, resolve o call center ativo pelo usuário e chama `CallCenterWebhookService.process` com identificador externo e timestamp gerados no servidor. Portanto, a simulação percorre a mesma inbox, locks, ordenação e regras de transição do webhook real.
