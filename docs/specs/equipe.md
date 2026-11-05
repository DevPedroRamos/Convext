# SPEC — Equipe, presença e status

## Problema

Não há visão do time nem forma de marcar disponibilidade. O dashboard mostra só a contagem. Status de trabalho não existe.

## Objetivo

Cada pessoa marca Disponível/Ausente e escolhe um status atual no menu do perfil. Admin vê a equipe em cards e cria os status (ícone + nome).

## Escopo

- Presença persistida (`available`): padrão Ausente. No login, popup para confirmar Disponível ou Ausente. Switch no popover do perfil. Bolinha no avatar. Sair volta a Ausente.
- Status atual (`status_id`) escolhido pelo próprio usuário na lista criada pelo admin. Aparece no trigger do perfil. Pode ficar vazio.
- Catálogo `team_statuses` com seed: Modo foco, Em reunião, Poucas demandas.
- `/app/equipe` só admin: cards (avatar, nome, cargo, e-mail, presença, status). O CRUD do catálogo de status fica em `/app/gestao` (spec Criativos).
- Card Equipe do dashboard aponta para `/app/equipe`.

## Não-escopo

- Tempo real, heartbeat, auto-ausente por inatividade.
- Criar contas ou alterar role/cargo na Equipe.
- Coordinator na página Equipe.
- Runner de testes.

## Comportamento

- Todo mundo começa Ausente (`available` default false).
- Ao autenticar, a área mostra um popup obrigatório: escolher Disponível ou Ausente e confirmar. Sem confirmar, permanece Ausente.
- Switch ligado = Disponível. Desligado = Ausente. Continua no menu depois do login.
- Sair grava Ausente antes de encerrar a sessão.
- Trocar presença ou status grava no próprio `profiles` e atualiza o menu.
- Admin cria/edita/exclui status em Gestão da plataforma (nome + ícone Lucide). Excluir zera o `status_id` de quem usava.
- Traffic/creator não veem Equipe no sidebar; `/app/equipe` cai no dashboard. O menu ainda troca presença e status.

## Arquitetura

```text
lib/access.ts                    área equipe
lib/team-status.ts               catálogo e labels
lib/profile.ts                   listTeamProfiles
app/api/me/presence|status
app/api/team-statuses
app/(dashboard)/app/equipe
components/dashboard/user-menu
components/dashboard/presence-prompt
```

## Banco

`team_statuses`: id, name, icon, sort_order, timestamps.

`profiles.available` boolean default false. `profiles.status_id` uuid nullable FK on delete set null.

RLS: select de status autenticado; escrita `profile_is_admin()`. Update de `available`/`status_id` no próprio perfil.

## Critérios de aceite

- Admin vê Equipe no sidebar, cards do time e consegue criar um status.
- Login abre o popup de presença; confirmar grava Disponível ou Ausente.
- Menu mostra bolinha, status atual, switch e lista de status.
- Traffic não abre `/app/equipe`. Continua alterando presença e status.

## Testes

Lint e browser (admin e, se possível, conferir `canAccessPath` para traffic).

## Riscos

Sem a migration no Supabase ligado, o menu falha ao gravar presença.
