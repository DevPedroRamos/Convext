# Demandas por tipo, com responsável copiado no insert

Data: 2026-10-29
Status: accepted

## Contexto

A página se chama Feedback. O registro é um pedido interno que, mais tarde, terá outros tipos (mídia e os que vierem). Duas alternativas apareceram: uma tabela `feedbacks` e, depois, uma tabela por tipo; ou uma entidade única com `kind`. O responsável do cliente também podia ser um join ao vivo ou um valor gravado na linha.

## Decisão

Uma tabela `demands` com `kind`. Feedback e mídia são valores do check; tipos novos entram no check, sem tabela nova. A UI de Feedback cria só `kind = feedback`. O payload de criação não manda `kind` nem `responsibleId`: o servidor fixa o tipo e copia `clients.responsible_id` para `demands.responsible_id`. Cliente sem responsável gera demanda com responsável nulo.

## Consequências

A lista de Feedback filtra por `kind`. Uma tabela `feedbacks` deixaria de existir quando mídia chegar. Feedback antigo permanece com o responsável da data do cadastro se o cliente mudar de dono. Trocar responsável ou cliente depois do insert fica fora desta entrega.
