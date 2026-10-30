# Visibilidade de demandas por operação e responsável

Data: 2026-10-29
Status: accepted

## Contexto

A lista de Feedback deixava qualquer autenticado ler e atualizar todas as linhas. A página Demandas precisa recortar por alocação. Filtrar só no app deixaria o PostgREST e as APIs abertos.

## Decisão

RLS em `demands`: select e update se `profile_is_ops()` (`admin` ou `coordinator`) ou se `responsible_id = auth.uid()`. Insert permanece autenticado. Delete continua admin. A alocação é o Responsável copiado do cliente, sem campo assignee.

## Consequências

A lista de Feedback herda o recorte. Demanda sem responsável some para traffic e creator. Trocar a regra depois exige nova policy, não só um filtro de UI.
