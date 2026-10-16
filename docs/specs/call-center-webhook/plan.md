# Plano técnico

Modelar a identidade externa do lead distribuído e uma chave única de evento para deduplicação. A estratégia de autenticação, formato de assinatura e regra de ordenação serão registradas em ADR antes da implementação.

O handler processará cada atualização em transação, comparará o instante do evento com o último evento aceito e atualizará a projeção de status somente quando a transição for válida.
