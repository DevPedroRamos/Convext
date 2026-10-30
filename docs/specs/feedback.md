# SPEC — Feedback (demandas)

## Problema

O time registra pedidos dos clientes fora da plataforma. Não há lista, filtro por responsável/empresa nem vínculo com o cadastro de clientes.

## Objetivo

Na área autenticada, cadastrar e consultar Feedbacks. Cada um é uma Demanda `kind = feedback` ligada a um Cliente, com o Responsável copiado no insert.

## Escopo

- Admin autenticado em `/app/feedback` (lista, criar, editar descrição).
- Botão em destaque "Cadastrar Feedback" abre modal na mesma página.
- Excluir somente se `profiles.role = 'admin'`.
- Tabela `demands` com `kind` em `feedback` | `midia` e `status` em `new` | `briefing` | `in_progress` | `completed`. Esta entrega só cria e lista `feedback`.
- Cadastro grava `status = new`, `priority` (default `medium`) e `due_on` opcional. A página mostra o rótulo e não altera status.
- Responsável vem de `clients.responsible_id` no momento do insert (nullable).
- Select e update respeitam operação vs alocado (ver spec Demandas).
- Filtros locais por responsável (inclui "Sem responsável") e empresa; busca local.
- Delete de cliente com demanda passa a falhar com erro claro (`on delete restrict`).

## Não-escopo

- Página, UI ou endpoint de mídia.
- Alterar status nesta página, anexos, comentários.
- Trocar cliente, tipo ou responsável depois do cadastro.
- Criar cliente pelo modal.
- Paginação no servidor.
- Página pública / site.
- Autorização por papel nas rotas (só o delete é admin).
- Runner de testes (não existe no repo).
- Reorganizar o monólito.

## Comportamento

- A tela diz **Feedback**. A entidade é **Demanda**. Cadastrar nesta página grava `kind = feedback` e `status = new`.
- Lista mostra cliente, responsável (nome do profile copiado na demanda), tipo, status e descrição. A página lista só Feedbacks.
- Modal: autosuggest de cliente (nome, WhatsApp ou empresa) sobre a lista já carregada. Ao selecionar, mostra o responsável do cliente. Descrição é obrigatória; prioridade e prazo entram no cadastro.
- O formulário não escolhe responsável, tipo nem status. O servidor copia o responsável do cliente e fixa `feedback` e `new`.
- Cliente sem responsável gera demanda com responsável nulo; a lista e o filtro "Sem responsável" cobrem esse caso.
- Se o cliente mudar de responsável depois, o Feedback antigo permanece com quem respondia na data.
- Filtros de responsável e empresa combinam entre si e com a busca. Busca local por nome do cliente, WhatsApp, empresa, descrição e nome do responsável.
- Editar altera só a descrição. Cliente, tipo e status ficam imutáveis nesta página.
- Quem não é admin não vê o botão excluir; a API e o RLS recusam o delete.
- A API `/api/feedback` recusa linha que não seja `kind = feedback`.

## Arquitetura

```text
lib/validations/demand.ts   domínio
lib/demands.ts              consultas / persistência
lib/clients.ts              autosuggest (lista já existente)
lib/profile.ts              isAdmin
app/api/feedback            adapters autenticados
app/(dashboard)/app/feedback
components/dashboard/app-sidebar.tsx   item Feedback
```

Modal com `components/ui/dialog`. Autosuggest filtra a lista de clientes no cliente; sem dependência nova.

## Banco

Tabela `demands`: id, client_id (FK clients, on delete restrict), responsible_id (FK profiles, on delete set null), kind check (`feedback`, `midia`), status check (`new`, `briefing`, `in_progress`, `completed`) default `new`, priority check (`low`, `medium`, `high`) default `medium`, due_on date nullable, description, created_by (FK profiles, on delete set null), timestamps.

Rótulos na UI: `new` Novo, `briefing` Briefing, `in_progress` Em progresso, `completed` Concluído. Prioridade: `low` Baixa, `medium` Média, `high` Alta.

RLS: select/update se operação ou alocado; insert autenticado; delete só `profile_is_admin()`. Ver ADR 0002.

`on delete restrict` em `client_id` impede apagar Cliente que já tem Demanda. A API de clientes devolve erro claro nesse caso.

## Critérios de aceite

- "Cadastrar Feedback" abre o modal; persistir cria Demanda `kind = feedback`, `status = new`, prioridade e prazo, com `client_id` e `responsible_id` copiado do cliente.
- Payload de criação sem `kind`, `status` e sem `responsibleId`; o servidor preenche os três.
- Lista em `/app/feedback` mostra só Feedbacks, com cliente, responsável, tipo, status, prioridade, prazo e descrição.
- Autosuggest encontra cliente por nome, WhatsApp ou empresa; ao selecionar, mostra o responsável.
- Filtros de responsável (inclui "Sem responsável") e empresa combinam com a busca local.
- Edição altera só a descrição. Status permanece o mesmo.
- Admin exclui Feedback; não-admin recebe 403.
- `/api/feedback` recusa Demanda que não seja Feedback.
- Excluir Cliente com Demanda falha com erro claro.

## Testes

Não há runner. Validar com lint e fluxo no browser (lista → cadastrar no modal com Status Novo → filtrar/buscar → editar descrição sem mudar status → excluir como admin; tentativa de excluir cliente com demanda).

## Riscos

Migration precisa ser aplicada no Supabase ligado. Sem a tabela, a página fica vazia. Delete de cliente que hoje passa passa a falhar se existir Demanda.
