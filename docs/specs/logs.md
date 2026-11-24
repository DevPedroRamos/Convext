# SPEC — Logs da área administrativa

## Objetivo

Admin vê um registro das alterações de configuração: equipe, gestão da plataforma e financeiro administrativo.

## Escopo

- Página `/app/gestao/logs`, só admin.
- Eventos em `platform_events` (equipe via API; gestão e financeiro via trigger).
- Visual no mesmo desenho do histórico da tarefa.

## Não-escopo

- Presença, heartbeat, avisos lidos.
- Comentários, kanban, agenda, clientes e cases.

## Comportamento

- Mais recentes primeiro. Vazio: “Nenhum registro ainda.”
- Mensagens sem senha, token ou valor de remuneração.
