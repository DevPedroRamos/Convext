# SPEC — Demandas (quadro de trabalho)

## Problema

O cadastro de Feedback existe, mas o time não tem quadro para executar. Não há prazo, prioridade, troca de status nem recorte por quem está alocado.

## Objetivo

Na área autenticada, cada pessoa trabalha as Demandas que pode ver: operação vê todas; os demais só aquelas em que é o Responsável. O quadro é kanban ou lista, com filtro e fluxo de status.

## Escopo

- Admin autenticado em `/app/demandas` (kanban, lista, detalhe em sheet).
- Operação (`admin` | `coordinator`) vê e atualiza todas. Traffic e creator só as suas (`responsible_id = auth.uid()`).
- Colunas de status: Novo, Briefing, Em progresso, Concluído. Arrastar o card persiste `status`.
- Prazo (`due_on`) e prioridade (`low` | `medium` | `high`) no banco e no cadastro de Feedback.
- Sheet à direita (metade da tela) com o conteúdo completo. Operação e o alocado editam status, prioridade, prazo e descrição.
- Filtros: busca, tipo, prioridade, prazo; responsável só para operação.
- Toggle kanban / lista.

## Não-escopo

- Página, UI ou endpoint de mídia.
- Anexos, comentários, campo assignee separado do Responsável.
- Persistir ordem dos cards na coluna.
- Trocar cliente, tipo ou responsável depois do cadastro.
- Analytics.
- Runner de testes (não existe no repo).
- Reorganizar o monólito.

## Comportamento

- A tela diz **Demandas**. Lista todos os `kind` que o RLS devolver.
- Card/linha: cliente, resumo da descrição, prioridade e prazo. Clique abre o sheet; o grip arrasta.
- Colunas do kanban são fixas (não reordenam). Ordem dentro da coluna: prioridade (alta primeiro), prazo, `created_at`. Reordenar na mesma coluna não grava posição.
- Demanda sem responsável some para quem não é operação. Operação vê e filtra "Sem responsável".
- A lista de Feedback herda o mesmo RLS.

## Arquitetura

```text
lib/validations/demand.ts   domínio
lib/demands.ts              consultas / persistência
lib/profile.ts              isOperations
app/api/demandas            adapters autenticados
app/(dashboard)/app/demandas
components/ui/kanban.tsx    primitive
components/ui/sheet.tsx     detalhe
```

## Banco

`demands` ganha `priority` (default `medium`) e `due_on` (date, nullable).

RLS: select/update se `profile_is_ops()` ou `responsible_id = auth.uid()`. Insert autenticado. Delete só `profile_is_admin()`.

Rótulos: `low` Baixa, `medium` Média, `high` Alta.

## Critérios de aceite

- Operação vê todas as Demandas; traffic/creator só as próprias.
- PATCH de demanda alheia por não-operação falha.
- Arrastar de Novo para Briefing persiste `status = briefing`.
- Sheet mostra o conteúdo e permite editar status, prioridade, prazo e descrição.
- Cadastro de Feedback grava prioridade (default `medium`) e prazo opcional; status continua `new`.
- Toggle kanban/lista e filtros de prioridade/prazo recortam o quadro.

## Testes

Não há runner. Validar com lint e fluxo no browser (cadastro com prazo → quadro operação → drag → sheet; sessão traffic só vê as próprias).

## Riscos

Migration e policies precisam estar no Supabase ligado. Sem `profile_is_ops()`, operação e membro veem o mesmo recorte.
