# SPEC — Cases dinâmicos

## Problema

A seção `#cases` é estática. Não há como cadastrar clientes nem abrir uma página individual.

## Objetivo

Cadastrar cases no admin, exibi-los como cards no site e abrir `/cases/[id]` com o conteúdo de cada cliente.

## Escopo

- Admin autenticado em `/app/cases` (lista, criar, editar, excluir).
- Card na home: nome, segmento, resumo, logo; capa opcional; clique → `/cases/[id]`.
- Página individual com conceito, localização, frentes, vídeo, identidades e prev/next.
- Tabela `cases`, bucket `cases`, RLS de leitura pública (publicados) e escrita autenticada.

## Não-escopo

- Página `/cases` de arquivo completo.
- Papéis de admin distintos.
- Runner de testes (não existe no repo).
- Reorganizar o monólito.

## Comportamento

- Só cases `published` aparecem no site.
- `[id]` aceita uuid ou slug.
- Sem cases publicados, a seção permanece com o título e um estado vazio.
- CTA da página individual aponta para `/contato`.

## Arquitetura

```text
lib/validations/case.ts  domínio
lib/cases.ts             consultas / slug / embed
app/api/cases            adapters autenticados
app/(dashboard)/app/cases
app/(marketing)/cases/[id]
components/marketing + components/forms
```

## Banco

Tabela `cases`: id, slug, name, segment, summary, logo_url, cover_url, concept, location, fronts[], video_url, identities jsonb, published, sort_order, timestamps.

## Critérios de aceite

- CRUD no admin persiste e publica.
- Home lê do banco.
- `/cases/[id]` renderiza o case e 404 se não publicado.
- Upload de imagens no Storage.

## Testes

Não há runner. Validar com lint e fluxo no browser (admin → home → detalhe).

## Riscos

Migration precisa ser aplicada no Supabase ligado. Sem a tabela, a home cai no estado vazio.
