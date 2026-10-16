# Plano técnico

Adicionar `Distribution` e configuração de peso por call center. A estratégia será escolhida antes da implementação e registrada em ADR, considerando distribuição proporcional, determinismo em lotes curtos e concorrência no PostgreSQL.

O dispatcher executará em transação e impedirá distribuições duplicadas por constraint no banco. A integração com criação de lead será feita por uma porta de domínio, permitindo trocar implementação síncrona por worker futuro sem alterar o caso de uso de entrada.
