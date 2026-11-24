create table if not exists public.feedback_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  solution text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists feedback_types_set_updated_at on public.feedback_types;
create trigger feedback_types_set_updated_at
before update on public.feedback_types
for each row execute function public.set_updated_at();

alter table public.feedback_types enable row level security;

drop policy if exists "feedback_types_authenticated_select" on public.feedback_types;
create policy "feedback_types_authenticated_select" on public.feedback_types
for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "feedback_types_admin_insert" on public.feedback_types;
create policy "feedback_types_admin_insert" on public.feedback_types
for insert to authenticated
with check (public.profile_is_admin());

drop policy if exists "feedback_types_admin_update" on public.feedback_types;
create policy "feedback_types_admin_update" on public.feedback_types
for update to authenticated
using (public.profile_is_admin())
with check (public.profile_is_admin());

drop policy if exists "feedback_types_admin_delete" on public.feedback_types;
create policy "feedback_types_admin_delete" on public.feedback_types
for delete to authenticated
using (public.profile_is_admin());

grant select, insert, update, delete on public.feedback_types to authenticated;
revoke all on public.feedback_types from anon;

insert into public.feedback_types (name, solution, sort_order)
values
  ('Campanha nova', '', 0),
  ('ajuste', '', 1),
  ('DDD de fora', '', 2),
  ('ajuste de formulário', '', 3),
  ('renda baixa', '', 4),
  ('restrição', '', 5),
  ('falta de interação', '', 6),
  ('Fora da faixa etária', '', 7)
on conflict (name) do nothing;

update public.space_forms
set fields = coalesce((
  select jsonb_agg(
    case
      when elem->>'key' = 'tipo' then (elem - 'options') || '{"type":"feedback"}'::jsonb
      else elem
    end
    order by ordinality
  )
  from jsonb_array_elements(fields) with ordinality as t(elem, ordinality)
), fields)
where name = 'Cadastrar feedback';
