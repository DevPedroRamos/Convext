# SPEC — Acesso por role no /app

## Problema

Qualquer usuário onboarded vê o sidebar completo e abre Clientes, Feedback e Cases pela URL. Traffic e creator não deveriam entrar nessas áreas. Esconder o link não basta: a API e o PostgREST ainda aceitam escrita.

## Objetivo

Cada role só alcança as áreas que lhe cabem. Admin tem tudo. Coordinator opera clientes, cases, feedback e demandas de todos. Traffic e creator ficam no Dashboard e nas próprias Demandas.

## Escopo

- Sidebar e atalho circular filtrados pela role.
- Proxy recusa URL fora da área e manda para `/app`.
- APIs de clientes, cases e feedback recusam quem não é operação (403).
- RLS: insert/update de `clients` e escrita de `cases` só `profile_is_ops()`.
- Role nula trata como creator.

## Não-escopo

- Novas roles. Equipe, presença e status estão em `docs/specs/equipe.md`.
- Mudar a visibilidade de Demandas (ADR 0002).
- Site público, login, onboarding.
- Destacar o item ativo no sidebar.
- Runner de testes.

## Comportamento

| Área | admin | coordinator | traffic | creator |
|---|---|---|---|---|
| Dashboard `/app` | sim | sim | sim | sim |
| Demandas | sim (todas) | sim (todas) | sim (suas) | sim (suas) |
| Clientes | sim | sim | não | não |
| Feedback | sim | sim | não | não |
| Cases | sim | sim | não | não |
| Perfil | sim | sim | sim | sim |
| Equipe | sim | não | não | não |
| Gestão | sim | não | não | não |

- Perfil continua só no menu do usuário.
- Delete de cliente e feedback continua só admin.
- FAB (Feedback, Cliente, Case) só para operação.
- Digitar `/app/clientes` como traffic redireciona para `/app`.

## Arquitetura

```text
lib/access.ts                 canAccessArea / canAccessPath
lib/profile.ts                isOperations
proxy.ts                      gate de URL
app/(dashboard)/app/layout    FAB só operação
components/dashboard/app-sidebar
app/api/clients|cases|feedback
```

## Banco

Select de `clients` permanece autenticado (join do quadro). Insert/update de `clients` e insert/update/delete de `cases` exigem `profile_is_ops()`. Delete de cliente segue `profile_is_admin()`.

## Critérios de aceite

- Admin vê os cinco itens do sidebar e o FAB.
- Coordinator vê Dashboard, Clientes, Feedback, Demandas e Cases.
- Traffic/creator vêem só Dashboard e Demandas. `/app/clientes` cai no dashboard.
- POST/PATCH em `/api/clients`, `/api/cases` e `/api/feedback` por traffic devolve 403.
- Perfil abre para qualquer onboarded.

## Testes

Não há runner. Lint e browser: sessão admin (nav completo); conferir `canAccessPath` para traffic.

## Riscos

Sem a migration no Supabase ligado, a API recusa mas o PostgREST ainda aceita escrita autenticada.
