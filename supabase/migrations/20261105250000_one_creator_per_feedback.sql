create unique index if not exists demands_one_creator_per_source_idx
  on public.demands (source_demand_id)
  where kind = 'creator' and source_demand_id is not null;
