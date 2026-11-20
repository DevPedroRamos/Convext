# Memória dos agentes no Supabase existente, embeddings no Workers AI

Data: 2026-11-20
Status: accepted

## Contexto

A memória e o RAG precisam de busca textual, busca vetorial, grafo e métricas, consumíveis por
vários agentes e projetos. Opções: banco vetorial dedicado, Vectorize + D1 na Cloudflare, ou o
Postgres do Supabase que o projeto já usa. Para embeddings: OpenAI, Supabase `gte-small`
(inglês) ou Workers AI. Para o modelo: SDK oficial ou `fetch`.

## Decisão

Postgres do Supabase com `pgvector` + FTS `portuguese`/`unaccent` (uma migration, RLS, sem
serviço novo). Embeddings `@cf/baai/bge-m3` do Workers AI via REST: multilíngue, mesma conta
Cloudflare do deploy, sem dependência. `@anthropic-ai/sdk` é a única dependência nova (chamada
com cache, fallback e tipos de `usage`). Fusão, grafo e orçamento ficam em TypeScript puro,
testado sem banco. O grafo vive em `kb_nodes`/`kb_edges`; o Graphify entra por importação do seu
`graph.json`, sem rodar Python no Worker.

## Consequências

Corpus de dezenas de milhares de chunks cabe com folga no HNSW do Postgres. Sem credenciais do
Workers AI o serviço continua funcionando só com busca textual. Trocar de provedor de embedding
exige reembedar (o hash de chunk evita o resto do reprocessamento).
