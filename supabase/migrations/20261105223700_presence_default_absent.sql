alter table public.profiles
  alter column available set default false;

update public.profiles
set available = false
where available is distinct from false;
