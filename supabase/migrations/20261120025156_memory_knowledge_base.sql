-- Memória, RAG híbrido, grafo de conhecimento e métricas de execução dos agentes.
-- Acesso exclusivo pelo servidor (service role) via /api/memory/*: RLS ligado e sem policies.

create extension if not exists vector with schema extensions;
create extension if not exists unaccent with schema extensions;

create table public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  path text not null,
  title text not null,
  kind text not null default 'note',
  tags text[] not null default '{}',
  pinned boolean not null default false,
  content text not null,
  content_hash text not null,
  tokens integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (project, path)
);

create table public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents (id) on delete cascade,
  project text not null,
  position integer not null,
  heading text not null default '',
  content text not null,
  content_hash text not null,
  tokens integer not null default 0,
  embedding extensions.vector(1024),
  fts tsvector,
  unique (document_id, position)
);

create index kb_chunks_project_idx on public.kb_chunks (project);
create index kb_chunks_hash_idx on public.kb_chunks (project, content_hash);
create index kb_chunks_fts_idx on public.kb_chunks using gin (fts);
create index kb_chunks_embedding_idx on public.kb_chunks using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.kb_chunks_set_fts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fts :=
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(new.heading, ''))), 'A') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(new.content)), 'B');
  return new;
end;
$$;

create trigger kb_chunks_fts_trigger
before insert or update of heading, content on public.kb_chunks
for each row execute function public.kb_chunks_set_fts();

create table public.kb_nodes (
  project text not null,
  id text not null,
  kind text not null,
  label text not null,
  source text not null default 'docs',
  props jsonb not null default '{}'::jsonb,
  primary key (project, id)
);

create table public.kb_edges (
  project text not null,
  src text not null,
  dst text not null,
  relation text not null,
  weight real not null default 1,
  source text not null default 'docs',
  primary key (project, src, dst, relation)
);

create index kb_edges_src_idx on public.kb_edges (project, src);
create index kb_edges_dst_idx on public.kb_edges (project, dst);

create table public.kb_runs (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  agent text not null,
  operation text not null,
  model text,
  query text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  context_tokens integer not null default 0,
  baseline_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  latency_ms integer not null default 0,
  retrieval jsonb not null default '{}'::jsonb,
  quality jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index kb_runs_project_created_idx on public.kb_runs (project, created_at desc);

create table public.kb_eval_runs (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  mode text not null,
  config jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  cases jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.kb_documents enable row level security;
alter table public.kb_chunks enable row level security;
alter table public.kb_nodes enable row level security;
alter table public.kb_edges enable row level security;
alter table public.kb_runs enable row level security;
alter table public.kb_eval_runs enable row level security;

-- Busca híbrida: devolve os candidatos das duas listas (textual e vetorial) com o rank
-- de cada uma. A fusão (RRF), o reforço do grafo e o orçamento de tokens ficam em
-- lib/memory, onde são testados sem banco.
create or replace function public.kb_hybrid_search(
  p_project text,
  p_query text,
  p_embedding extensions.vector(1024) default null,
  p_limit integer default 24,
  p_kinds text[] default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  path text,
  title text,
  kind text,
  heading text,
  content text,
  tokens integer,
  chunk_position integer,
  lex_rank integer,
  vec_rank integer,
  lex_score real,
  vec_score real
)
language sql
stable
set search_path = ''
as $$
  with q as (
    -- plainto_tsquery faz AND entre termos; trocar por OR melhora o recall de perguntas
    -- em linguagem natural. O ranking (ts_rank_cd) continua favorecendo quem cobre mais termos.
    select nullif(replace(plainto_tsquery('portuguese', extensions.unaccent(p_query))::text, ' & ', ' | '), '')::tsquery as tsq
  ),
  scoped as (
    select c.*, d.path, d.title, d.kind
    from public.kb_chunks c
    join public.kb_documents d on d.id = c.document_id
    where c.project = p_project
      and (p_kinds is null or d.kind = any (p_kinds))
  ),
  lex as (
    select s.id, ts_rank_cd(s.fts, q.tsq, 32)::real as score,
      row_number() over (order by ts_rank_cd(s.fts, q.tsq, 32) desc)::integer as rnk
    from scoped s, q
    where q.tsq is not null and s.fts @@ q.tsq
    order by score desc
    limit p_limit
  ),
  vec as (
    select s.id, (1 - (s.embedding operator(extensions.<=>) p_embedding))::real as score,
      row_number() over (order by s.embedding operator(extensions.<=>) p_embedding)::integer as rnk
    from scoped s
    where p_embedding is not null and s.embedding is not null
    order by s.embedding operator(extensions.<=>) p_embedding
    limit p_limit
  ),
  ids as (
    select id from lex union select id from vec
  )
  select s.id, s.document_id, s.path, s.title, s.kind, s.heading, s.content, s.tokens, s.position,
    lex.rnk, vec.rnk, lex.score, vec.score
  from ids
  join scoped s on s.id = ids.id
  left join lex on lex.id = ids.id
  left join vec on vec.id = ids.id;
$$;

revoke execute on function public.kb_hybrid_search(text, text, extensions.vector, integer, text[]) from public, anon, authenticated;
revoke execute on function public.kb_chunks_set_fts() from public, anon, authenticated;
grant execute on function public.kb_hybrid_search(text, text, extensions.vector, integer, text[]) to service_role;
