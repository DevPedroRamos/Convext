# SPEC — Clientes administrativos

## Problema

O time Convext gerencia corretores e contas comerciais (hoje ECON VENDAS) fora da plataforma. Não há cadastro, responsável nem WhatsApp no admin.

## Objetivo

Cadastrar e consultar clientes na área autenticada, cada um opcionalmente ligado a um perfil da equipe.

## Escopo

- Admin autenticado em `/app/clientes` (lista, criar, editar).
- Excluir somente se `profiles.role = 'admin'`.
- Tabela `clients` com seed da lista ECON VENDAS.
- Responsável é `profiles.id` (nullable).

## Não-escopo

- Página pública / site.
- Autorização por papel nas rotas (só o delete é admin).
- CRM, funil, histórico, importação contínua.
- Runner de testes (não existe no repo).
- Reorganizar o monólito.

## Comportamento

- **Cliente** é o contato comercial. **Case** continua sendo a peça pública do site.
- Lista mostra nome, responsável (nome do profile), empresa e WhatsApp.
- Responsável vazio é permitido.
- WhatsApp é texto livre; dois números no mesmo campo permanecem juntos.
- Busca local por nome, empresa ou responsável.
- Quem não é admin não vê o botão excluir; a API e o RLS recusam o delete.

## Arquitetura

```text
lib/validations/client.ts   domínio
lib/clients.ts              consultas / persistência
lib/profile.ts              isAdmin, diretório da equipe
app/api/clients             adapters autenticados
app/(dashboard)/app/clientes
```

## Banco

Tabela `clients`: id, name, responsible_id (FK profiles, on delete set null), company, whatsapp, timestamps. Unique (name, company).

RLS: select/insert/update autenticado; delete só `profile_is_admin()`. Profiles: select autenticado para o join e o select de responsável.

## Critérios de aceite

- Seed ECON VENDAS aparece na lista.
- Cadastro e edição persistem.
- FK só grava se o profile existir.
- Admin exclui; não-admin recebe 403.

## Testes

Não há runner. Validar com lint e fluxo no browser (lista → novo → editar → excluir como admin).

## Riscos

Migration precisa ser aplicada no Supabase ligado. Sem a tabela, a página fica vazia.
