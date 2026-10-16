# Plano técnico

`DistributionJob` é o outbox durável criado junto do lead. O publicador consulta trabalhos pendentes a cada cinco segundos e usa o ID do trabalho como `jobId` BullMQ; republicações são seguras porque BullMQ deduplica o mesmo ID.

Redis/BullMQ fica em `src/providers/queue/`. `src/modules/dispatcher/` concentra o publicador, worker, regras puras e caso de uso de distribuição. Redis usa volume local e URLs independentes para desenvolvimento e testes.

O worker toma um advisory lock transacional do PostgreSQL antes de ler e atualizar as configurações. Ele soma cada peso ao peso corrente, escolhe o maior, subtrai o peso total do selecionado e grava todos os pesos correntes na mesma transação que cria `Distribution`. A constraint única de `Distribution.leadId` torna reprocessamentos seguros.

`CallCenterDispatchConfig` mantém peso, peso corrente e ativação. `Distribution` registra destino, estratégia, pesos aplicados e instante. `DistributionJob` mantém estado, tentativas, erro, próximo retry e instantes de publicação/conclusão.
