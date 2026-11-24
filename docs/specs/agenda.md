# SPEC — Agenda

Decisão e regras: `docs/adr/0005-agenda-compromissos.md`. Vocabulário: `GLOSSARY.md` → Agenda.
Antes de codar, leia `AGENTS.md` (Next 16: consulte `node_modules/next/dist/docs/`) e `docs/specs/espacos.md`.

## Objetivo

Um formulário de Espaço pode agendar um **Compromisso** junto com a tarefa. A página `/app/agenda` mostra esses compromissos no calendário: o creator vê os seus, e coordenador e admin veem os da equipe.

## Regras

- O campo do tipo `appointment` ("Compromisso") pode aparecer no máximo uma vez por formulário.
- Ao preencher o formulário, o switch "Agendar compromisso" mostra os campos:
  - Data e Hora de início, obrigatórias.
  - Duração, com 60 min por padrão e opções 30, 60, 90, 120 ou outra.
  - Local, texto livre de até 200 caracteres. Exemplo: "Econ Parque do Carmo".
  - Participantes, pelo menos um.
- Se o campo for obrigatório no formulário, o switch já vem ligado e travado.
- Participantes possíveis: membros ativos com role `creator`, `coordinator` ou `admin`.
- Leitura: admin e coordenador veem todos; os demais veem só os compromissos em que são participantes.
- Remarcar (data, hora, duração, local, participantes) e remover: só coordenador e admin.
- Criar, remarcar ou remover gera um evento no histórico da tarefa e um aviso (`notifications`) para os participantes, exceto para quem fez a ação.
- Horários ficam em `timestamptz`. A interface usa o fuso local e formatos `pt-BR`.
- Todo formulário abre no drawer lateral direito (`Sheet size="panel"`). Nada de `Dialog` central.

## Fase 1 — Banco

Criar a migration `supabase/migrations/<timestamp>_agenda.sql`. O SQL é aplicado manualmente no Supabase.

- `task_appointments`:
  - `id`
  - `task_id` (unique, FK `space_tasks`, on delete cascade)
  - `starts_at`
  - `ends_at`, com check `ends_at > starts_at`
  - `location text`, com check de até 200 caracteres
  - `created_by`, `created_at`, `updated_at` (trigger `set_updated_at`)
  - Índice em `starts_at`.
- `task_appointment_attendees`:
  - `appointment_id` (FK, cascade) e `user_id` (FK `profiles`, cascade), com PK composta.
  - Índice em `user_id`.
- Constraint `space_task_events.kind`: acrescentar `'scheduled'`, `'rescheduled'` e `'unscheduled'`.
- Função `appointment_visible(p_appointment_id)` (security definer): retorna verdadeiro se o usuário é admin, coordenador ou participante.
- RLS de `select` nas duas tabelas usando essa função. Sem insert, update ou delete direto: a escrita passa pelas funções abaixo.
- `space_task_visible`: liberar também para participante do compromisso da tarefa e para coordenador quando a tarefa tem compromisso.
- `space_create_task`: recriar a função com o parâmetro novo `p_appointment jsonb default null`, no formato `{ startsAt, durationMinutes, location, attendeeIds[] }`.
  - Validar data, duração entre 15 e 720 min e pelo menos um participante válido.
  - Inserir o compromisso, os participantes, o evento `scheduled` e os avisos.
  - Se o formulário tem campo `appointment` obrigatório e `p_appointment` vier nulo, recusar.
- Funções `task_appointment_update(p_task_id, p_appointment jsonb)` e `task_appointment_delete(p_task_id)`:
  - Só para `coordinator` ou `admin`.
  - Substituem os participantes, gravam o evento (`rescheduled`/`unscheduled`) e avisam os participantes.
- `revoke`/`grant execute` para as funções novas, como em `20261121214851_spaces.sql`.

## Fase 2 — Domínio

- `lib/spaces/types.ts`:
  - Incluir `"appointment"` em `FIELD_TYPES`.
  - Criar o tipo `TaskAppointment = { id, taskId, startsAt, endsAt, location, attendees: { id, name }[] }`.
  - Incluir `"scheduled" | "rescheduled" | "unscheduled"` em `TaskEvent.kind`.
- `lib/validations/spaces.ts`:
  - `appointmentInputSchema` (`startsAt` ISO, `durationMinutes` entre 15 e 720 com default 60, `location` até 200, `attendeeIds` uuid min 1).
  - `createTaskSchema` ganha `appointment` opcional.
  - `spaceFormSchema` ganha um refine: no máximo um campo `appointment`.
  - `taskActionSchema` ganha as ações `reschedule` e `unschedule`.
- `lib/spaces/rules.ts`:
  - `firstMissingField` passa a tratar `appointment` obrigatório.
  - Nova função `canReschedule(role)`, verdadeira para `admin` e `coordinator`.
- `lib/access.ts`:
  - Nova área `agenda` para `admin`, `coordinator` e `creator`.
  - `areaFromPath("/app/agenda")` retorna `"agenda"`.
- Novo `lib/agenda/data.ts` (server-only):
  - `listAppointments({ from, to, userId? })`, que traz junto a tarefa (título, `space_id`, cor e nome do espaço) e os participantes.
  - `listAttendeeOptions()`.
- Testes em `tests/spaces/rules.test.ts` e em `tests/agenda/` para o schema, `firstMissingField` e o acesso.

## Fase 3 — Formulário e tarefa

- `components/spaces/form-builder.tsx`: `FIELD_LABELS.appointment = "Compromisso"`.
- Novo `components/spaces/appointment-field.tsx`:
  - O switch e os campos de data, hora, duração (select com 60 min de padrão), local e participantes (`SearchableSelect` múltiplo ou chips).
  - Usar o `Field` de `components/finance/ui`.
- `components/spaces/task-form-dialog.tsx`:
  - `FieldInput` renderiza o `AppointmentField`.
  - O estado do compromisso fica separado de `values` e vai no POST como `appointment`.
- `app/api/spaces/tasks/route.ts` e `lib/spaces/data.ts#createTask`: repassar `p_appointment` para a RPC.
- `app/api/spaces/tasks/[id]/route.ts` e `runTaskAction`: implementar `reschedule` e `unschedule` chamando as funções novas.
- `components/spaces/task-sheet.tsx`:
  - Bloco "Compromisso" com data, horário, local e participantes.
  - Para coordenador e admin, os botões "Remarcar" (abre o `AppointmentField` no próprio sheet) e "Remover".
- `components/spaces/task-history.tsx`: textos para os eventos novos.

## Fase 4 — Página Agenda

- `components/dashboard/sidebar-nav.tsx`: item `{ href: "/app/agenda", label: "Agenda", icon: CalendarDays }`, logo após "Minhas tarefas". O `canAccessPath` já filtra quem vê.
- `app/(dashboard)/app/agenda/page.tsx` (server component):
  - Ler a sessão e a role e chamar `listAppointments` para o intervalo dos `searchParams` (`?de=&ate=`). O padrão é o mês atual ± 7 dias.
  - Para coordenador e admin, passar também a lista de pessoas para o filtro.
- `components/ui/event-manager.tsx`, adaptado do componente enviado:
  - Não copiar os `button`, `select`, `dialog`, `badge`, `input`, `card` e `label` do snippet. Usar os de `components/ui/*`, que já existem.
  - Visões Mês, Semana, Dia e Lista, com busca. Tudo em pt-BR (`toLocaleDateString("pt-BR")`) e semana começando no domingo.
  - Remover: criar e editar evento por modal, arrastar e soltar, tags e categorias.
  - Os eventos vêm por props, sem `useState(initialEvents)`.
  - A cor do evento é a cor hex do espaço (`style`), e não as classes `bg-*-500`.
  - Corrigir o início da semana: `setDate(date.getDate() - date.getDay())`.
  - Corrigir os fragments da visão semanal, que precisam de `key`.
  - Props: `events`, `onEventClick`, `onRangeChange` e um slot `toolbar` para os filtros.
- Novo `components/agenda/agenda-view.tsx` (client):
  - Mapeia `TaskAppointment` para o evento do calendário.
  - Filtros por espaço e, para coordenador e admin, por pessoa.
  - `onRangeChange` atualiza a URL.
  - Clicar num evento abre o `TaskSheet` da tarefa.
  - O botão "Novo compromisso" abre o atalho com os formulários que têm campo `appointment` e que o usuário pode enviar.
- Estado vazio: "Nenhum compromisso neste período".

## Pronto quando

- Um creator abre uma demanda com compromisso, escolhe um participante, e o compromisso aparece na agenda desse participante e na de coordenador e admin. Não aparece para outro creator.
- Tráfego e comercial não veem "Agenda" e recebem bloqueio em `/app/agenda`.
- Coordenador remarca pelo sheet da tarefa: o calendário atualiza, o histórico registra a mudança e o participante recebe o aviso. O creator não vê o botão Remarcar.
- Formulário sem o campo Compromisso funciona como antes.
- `npm run lint`, `npm test` e `npm run build` passam.
