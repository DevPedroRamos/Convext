# SPEC — Espaços

## Problema

Demandas e Feedback eram a mesma coisa (uma tarefa com etapas e responsável) com telas diferentes. Cada regra estava escrita no código: tipos fixos (`kind`), quatro colunas fixas, exceções por role espalhadas em funções e rotas, e um atalho rápido com quatro ações fixas só para operação. Criar um fluxo novo exigia migration e código.

## Objetivo

O admin configura, sem código:

- **Espaços**: um por time, com as roles que são membros.
- **Fluxos**: as etapas de cada espaço (colunas do quadro), com dono por role, aprovação e informação exigida.
- **Formulários**: abrem tarefas num espaço, com campos e público por role.
- **Atalho rápido**: formulários e ações do sistema, visíveis por role.

## Comportamento

- **Dono da etapa**: uma role (`admin`, `coordinator`, `traffic`, `creator`, `commercial`) ou "quem solicitou". Ao entrar na etapa, a tarefa fica na fila da role e quem tem essa role é avisado. Alguém da role pode "pegar para mim"; a partir daí só essa pessoa age.
- **Avançar**: só o dono da etapa (ou o admin) conclui a etapa e envia para a próxima, uma por vez.
- **Informação exigida**: a etapa pode exigir um dado para concluir (ex.: "Link da arte"). O valor fica gravado na tarefa.
- **Aprovação**: etapa do tipo aprovação mostra Aprovar e Recusar só para o dono. Recusar exige motivo e devolve para a etapa configurada (ou a anterior).
- **Concluída**: a última etapa é sempre do tipo Concluída. Quem abriu a tarefa é avisado.
- **Visibilidade**: admin vê tudo; membros veem as tarefas do espaço; os demais veem só o que abriram ou o que pegaram.
- **Admin** move a tarefa para qualquer etapa, edita a ficha (formulário, cliente, responsável), solicita reajuste (devolve à etapa de recusa com motivo, inclusive em concluídas), exclui tarefas e configura tudo em `/app/gestao/*`.
- **Avisos** no app (sino no cabeçalho). E-mail fica para depois.
- **Cliente** é um tipo de campo de formulário; cada formulário decide se pede e se é obrigatório.
- **Minhas tarefas** (`/app/tarefas`): "Sua vez" (o que espera por você) e "Minhas solicitações".
- O quadro mostra as concluídas dos últimos 30 dias.

## Telas

| Rota | Quem | O que |
|---|---|---|
| `/app/tarefas` | todos | Sua vez e Minhas solicitações |
| `/app/espacos/[id]` | todos | Quadro do espaço (membros veem tudo; os demais, só o que abriram) |
| `/app/gestao/espacos` | admin | Espaços, membros, cor e fluxo |
| `/app/gestao/formularios` | admin | Construtor de formulários com pré-visualização |
| `/app/gestao/atalhos` | admin | Atalhos por role |

## Arquitetura

```text
supabase/migrations/20261121214851_spaces.sql   tabelas, RLS e funções do fluxo; remove demands/feedback_types/demand_files
lib/spaces/rules.ts                              espelho das regras para a interface (canAct, isMyTurn, flowProblems…)
lib/spaces/data.ts                               leitura e chamadas das funções (server-only)
lib/spaces/http.ts                               guard/parse/respond das rotas
lib/validations/spaces.ts                        zod
app/api/spaces/*, app/api/notifications          rotas
components/spaces/*                              quadro, painel da tarefa, formulário, editores, sino
components/dashboard/app-quick-actions.tsx       botão laranja montado a partir de quick_actions
```

Banco: `spaces`, `space_stages`, `space_forms` (campos em JSON), `space_tasks` (valores em JSON), `space_task_events` (histórico e comentários), `notifications`, `quick_actions`.

As tarefas só mudam pelas funções `space_create_task`, `space_task_advance`, `space_task_approve`, `space_task_reject`, `space_task_claim`, `space_task_move`, `space_task_comment`, `space_task_update` e `space_task_rework` (security definer). Elas aplicam as regras e gravam histórico e avisos. A RLS não dá update direto em `space_tasks` a quem não é admin.

## Espaços iniciais

- **Campanhas**: Solicitada (coordenador) → Arte em criação (creator, exige link da arte) → Campanha em criação (tráfego, exige link da campanha) → Aguardando aprovação (admin; recusa volta para a arte) → Concluída.
- **Tráfego pago**: Solicitada → Em execução → Campanha criada (exige link) → Aguardando aprovação (admin) → Concluída.
- **Feedback de clientes**: Novo (coordenador) → Em tratamento (tráfego, exige resposta ao cliente) → Concluído.
- **Reports e bugs**: qualquer role envia; só o admin é membro.

## Não-escopo

- Cargos cadastrados (decidido usar as roles atuais).
- Subtarefas em paralelo, prazos por etapa, anexos de arquivo, avisos por e-mail.
- Formulários públicos (fora da plataforma).
- Migração das demandas antigas (descartadas por decisão do produto; o bucket `demand-files` ficou sem uso).

## Critérios de aceite

- Comercial abre "Pedir campanha nova" pelo atalho; a tarefa cai em Solicitada e o coordenador é avisado.
- Creator não avança Solicitada; coordenador avança; creator só conclui a arte informando o link.
- Tráfego não aprova; admin recusa com motivo e a tarefa volta para Arte em criação; depois aprova e quem abriu é avisado.
- Tráfego não vê "Reports e bugs" de outras pessoas; quem enviou vê o próprio.
- Admin cria um espaço com três etapas e um formulário, coloca no atalho de uma role e essa role passa a ver o atalho.
