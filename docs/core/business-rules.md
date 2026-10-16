# Regras de negócio

## Usuários e acesso

- `ADMIN` acessa recursos administrativos, métricas e qualquer call center.
- `OPERATOR` deve estar associado a exatamente um `CallCenter` e só pode consultar ou atualizar leads daquele call center.
- Usuários inativos não podem autenticar nem acessar recursos autenticados.
- A autorização é aplicada no backend. A interface apenas reflete as permissões retornadas pela API.

## Dados mínimos

- E-mail de usuário é normalizado para minúsculas e único.
- Senhas são armazenadas somente como hash Argon2id.
- Os call centers iniciais são criados apenas por seeds explícitas. O recebimento de leads não cria nem altera call centers.

## Leads e catálogo comercial

- Produtos podem participar de vários funis por uma associação explícita e ativável. Um lead referencia uma associação válida entre produto e funil, além de origem e status atual. Afiliado é opcional.
- O status inicial é `NEW`; eventos de status são imutáveis para auditoria.
- A criação de leads exige uma chave de idempotência única e valida a compatibilidade entre produto e funil.

## Distribuição

- Cada novo lead possui um único trabalho de distribuição criado na mesma transação do recebimento.
- Uma repetição idempotente não cria novo trabalho nem nova distribuição.
- Apenas call centers ativos e habilitados para distribuição são elegíveis. Os pesos são inteiros positivos e relativos; centros inativos são excluídos da proporção.
- Cada lead possui no máximo uma distribuição, registrada com estratégia, pesos e instante da decisão.
