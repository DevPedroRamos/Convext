---
kind: note
tags: [moc]
---
# Convext — mapa do conhecimento

Ponto de entrada do vault Obsidian (`docs/`). Os links abaixo alimentam o grafo da memória
(`/api/memory/graph`) e a navegação no Obsidian. O vocabulário fica em `GLOSSARY.md` e o
produto em `PRODUCT.md` (raiz do repositório; ambos fixados no contexto dos agentes).

## Specs

- [[app-access]] — acesso por role no `/app`
- [[clients]] — clientes administrativos
- [[feedback]] — cadastro de Feedback
- [[demandas]] — quadro de demandas
- [[criativos]] — criativos, tipos de feedback e Gestão
- [[cases]] — cases dinâmicos
- [[team-onboarding]] — equipe, papéis e onboarding
- [[equipe]] — gestão de equipe, presença e status
- [[comunicacao-tempo-real]] e [[comunicacao-wireframes]] — Salas e chamadas
- [[memoria-contexto]] — memória, RAG híbrido e Context Builder

## Decisões (ADR)

- [[0001-demandas-por-tipo]]
- [[0002-visibilidade-demandas]]
- [[0003-memoria-rag-hibrido]]

## Operação

- [[deploy-checklist]]

## Memórias

Decisões, fatos e lições registrados por agentes via `POST /api/memory/memories` ficam em
`memorias/` depois de `npm run memory -- pull`.
