# SPEC — Criativos, tipos de feedback e Gestão da plataforma

## Problema

O cadastro de Feedback não classifica o pedido nem sugere solução. Campanha nova e o pedido explícito do gestor não geram trabalho para o designer. Não há upload de criativo nem um lugar único para o admin manter catálogos.

## Objetivo

Classificar Feedback com tipo e solução. Gerar demanda `kind = creator` para um creator escolhido (pelo tipo que dispara criativo, pelo cadastro direto ou por “Solicitar criativo”). O designer entrega um ou mais arquivos quando conclui. Admin gerencia tipos e status de presença em `/app/gestao`.

## Escopo

- Catálogo `feedback_types` (nome, solução, `spawns_creator`) com seed dos oito nomes.
- Feedback escolhe o tipo; a solução entra só leitura e é copiada na demanda.
- Tipo com `spawns_creator` cria também a demanda de criativo no mesmo cadastro.
- Cadastro de demanda de criativo: nome, cliente, creator, observação, briefing, referências.
- Botão “Cadastrar demanda” no quadro e no gatilho circular (operação).
- “Solicitar criativo” no sheet do Feedback: operação ou o responsável daquela demanda.
- Upload/download de criativos quando a demanda do designer está Concluída, ou após Variação.
- Admin: Reaproveitar briefing e Variação na demanda `creator`.
- Filtro por cliente e busca por nome/briefing no quadro.
- `/app/gestao` só admin: tipos de feedback e status de presença (saem de Equipe).

## Não-escopo

- Status do kanban editável.
- Qualquer creator ver todas as demandas de criativo.
- Paginação, comentários, trocar cliente depois do cadastro.
- Runner de testes.

## Comportamento

- A demanda de criativo é `kind = creator`. O creator escolhido grava em `responsible_id`.
- Select: operação, o responsável ou quem criou (`created_by`). Update: operação ou responsável. Traffic vê a demanda que solicitou; não edita a do designer.
- Tipo Campanha nova nasce com `spawns_creator`. Sem nome, creator e briefing o cadastro de Feedback não segue.
- Observação da demanda de criativo usa `description`. Solução do tipo é snapshot em `solution`.
- Referências e criativos ficam em `demand_files` + bucket privado `demand-files`. Download por URL assinada.
- Reaproveitar briefing abre o modal preenchido e cria outra demanda. Variação grava `variation_note` e, se Concluída, volta para Em progresso.

## Arquitetura

```text
lib/validations/demand.ts
lib/validations/feedback-type.ts
lib/feedback-types.ts
lib/demands.ts
lib/demand-files.ts
app/api/feedback-types
app/api/demandas
app/api/demandas/[id]/criativo|variacao|files
app/(dashboard)/app/gestao
```

## Banco

`feedback_types`: name, solution, spawns_creator, sort_order.

`demands`: kind passa a aceitar `creator`; title, briefing, feedback_type_id, solution, source_demand_id, variation_note.

`demand_files`: demand_id, kind (`reference` | `creative`), path, name, mime, created_by.

## Critérios de aceite

- Admin cadastra tipo com solução; o select de Feedback lista os tipos e mostra a solução.
- Campanha nova cria Feedback + demanda creator para o creator escolhido.
- Operação cadastra demanda pelo quadro e pelo gatilho.
- Gestor (responsável do Feedback) solicita criativo; traffic não usa o cadastro solto.
- Creator conclui e sobe um ou mais criativos; quem vê a demanda baixa o arquivo.
- Admin reaproveita briefing e pede variação.
- Quadro filtra por cliente e busca nome/briefing.
- `/app/gestao` só admin. Equipe fica só com os cards.

## Testes

Não há runner. Lint e fluxo no browser (tipo → campanha nova → quadro do creator → concluir → upload; solicitar criativo; gestão).

## Riscos

Migration e bucket precisam estar no Supabase ligado. Sem `created_by` no select, o traffic que solicita não consegue anexar referência.
