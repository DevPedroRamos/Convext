alter table public.demands
  add column if not exists status text not null default 'new'
  check (status in ('new', 'briefing', 'in_progress', 'completed'));
