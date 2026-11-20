---
kind: spec
tags: [memoria, agentes, rag]
related: [0003-memoria-rag-hibrido, Convext]
---
# SPEC — Memória, RAG híbrido e Context Builder

## Problema

Os agentes de código (Claude Code, Codex, Cursor e as skills em `.agents/skills`) leem specs e
o glossário inteiros ou adivinham o que ler. A documentação soma ~31 mil tokens; enviar tudo
custa caro, dilui a atenção do modelo e não escala com novas specs e decisões. Não havia
memória durável de decisões tomadas durante o trabalho dos agentes nem métrica de custo.

## Objetivo

Serviços reutilizáveis no Worker/API (`/api/memory/*`) que recuperam e montam só o contexto
necessário por agente e execução, com prompt pronto para cache, grafo de conhecimento,
memória durável e métricas que provam a economia.

## Escopo

- Vault Obsidian em `docs/` (`docs/.obsidian/app.json`, mapa em [[Convext]], memórias em `docs/memorias/`).
- Índice em Postgres: `kb_documents`, `kb_chunks` (FTS português + pgvector 1024), `kb_nodes`, `kb_edges`, `kb_runs`, `kb_eval_runs`.
- Busca híbrida: `kb_hybrid_search` devolve as listas textual e vetorial; RRF, corte seletivo, deduplicação e orçamento em `lib/memory/retrieval.ts`.
- Grafo: documentos, entidades do glossário, ADRs, tags e arquivos de código; importação do `graph.json` do Graphify.
- Context Builder por perfil de agente (`default`, `spec`, `code`, `review`; aliases das skills existentes).
- Prompt caching: prefixo estável (instruções + perfil + `GLOSSARY.md` e `PRODUCT.md` fixados) com breakpoint; histórico selecionado com breakpoint; trechos e tarefa no fim, sem cache.
- Métricas por execução (tokens, cache, custo, latência, fontes, qualidade) e avaliação com golden set.

## Não-escopo

- Caveman. Agentes novos. UI de administração. Sumarização de histórico por LLM.
- Leitura do código-fonte pelo índice (o Graphify cobre o código; o índice cobre conhecimento).

## Comportamento

| Endpoint | Uso |
|---|---|
| `POST /api/memory/ingest` | `{documents[], pinned[], prune}` — incremental por hash; embeddings reaproveitados por hash de chunk |
| `POST /api/memory/search` | `{query, k}` — busca híbrida |
| `POST /api/memory/context` | `{task, agent, history?, budgetTokens?}` — `prompt.system`/`prompt.messages` prontos para a Messages API, `sources`, `stats` |
| `POST /api/memory/ask` | contexto + Claude (`claude-opus-5-5`, esforço `medium`, fallback no servidor) com cache |
| `GET/POST /api/memory/memories` | lista / registra decisão, fato, preferência ou lição |
| `GET/POST /api/memory/graph` | vizinhança de um nó / importação do Graphify |
| `POST /api/memory/eval` | golden set: `retrieval` (grátis) ou `answer` (chama o modelo) |
| `GET /api/memory/metrics?days=7` | agregados por operação e agente |

Autenticação por `Authorization: Bearer <chave>` (`MEMORY_API_KEYS`, uma por consumidor).
Sem `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_AI_TOKEN` a busca opera em modo textual e informa
`retrievalMode: "lexical"`. Projetos diferentes usam o campo `project`.

CLI: `npm run memory -- sync | pull | context | search | ask | remember | graph | graphify | eval | metrics`.

## Arquitetura

```text
lib/memory/text.ts, markdown.ts      normalização, tokens, frontmatter, wikilinks, chunking
lib/memory/graph.ts                  grafo dos docs, Graphify, pesos normalizados por grau
lib/memory/retrieval.ts              RRF, corte, deduplicação, expansão pelo grafo, orçamento
lib/memory/context-builder.ts        perfil + recuperação + histórico + layout de cache
lib/memory/profiles.ts               perfis por agente/skill
lib/memory/store*.ts                 interface; Supabase (produção) e memória (benchmark/testes)
lib/memory/embeddings.ts             Workers AI bge-m3 (REST) + cache de consulta
lib/memory/llm.ts, pricing.ts        chamada Claude com cache; custo com e sem cache
lib/memory/metrics.ts, evaluation.ts agregação e métricas de recuperação/resposta
lib/memory/http.ts                   autenticação, validação, erros
app/api/memory/*                     rotas finas
scripts/memory.mjs                   CLI
```

O grafo **expande** a seleção (documentos fortemente ligados entram no orçamento que sobra);
não reordena o topo. A primeira versão reordenava e o benchmark mostrou queda de MRR.

## Banco

Migration `20261120025156_memory_knowledge_base.sql`. RLS ligado e sem policies: só service role.

## Critérios de aceite

- recall@5 ≥ 0,9, MRR ≥ 0,75 e economia de tokens ≥ 85% no golden set (`tests/memory/golden-set.json`).
- Prefixo idêntico (mesmo `prefixHash`) entre tarefas do mesmo perfil.
- Grafo não piora recall@5.
- Ingestão repetida sem mudança não reprocessa nem reembeda.

## Testes

`npm run test:memory` — unidade, integração das rotas com store em memória e benchmark
offline sobre o vault real. `npm run memory -- eval` repete a avaliação contra o índice real.

## Riscos

- Estimativa de tokens por caracteres (~3,6/token): o erro real aparece em `tokenEstimateErrorPct`.
- Preços em `lib/memory/pricing.ts` precisam acompanhar a tabela da Anthropic.
- Golden set pequeno (14 casos): ampliar quando surgirem perguntas reais dos agentes.
