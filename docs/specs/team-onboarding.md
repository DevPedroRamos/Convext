# SPEC — Equipe, papéis e onboarding

## Problema

A área autenticada tem um único usuário de teste. O time precisa de contas, cargo visível e um primeiro acesso que troca senha temporária e completa o perfil.

## Objetivo

Criar as contas da equipe no Auth, separar `role` de `cargo` em `profiles` e obrigar o primeiro login a definir senha, foto e telefone.

## Escopo

- Colunas `cargo` e `onboarding_completed`; `role` restrito a `admin | traffic | coordinator | creator`.
- Contas no Auth + perfil (Francisco, Marcus, Matheus, Amanda, Duda, Luana, Gabriel, Maria Eduarda, Ester).
- Atualizar Pedro Ramos: e-mail `pedroramosnext@gmail.com`, `admin`, `TECH LEAD`, onboarding já completo. Senha permanece.
- `/app/onboarding` no primeiro acesso.
- `/app/perfil` sem `role`; cargo somente leitura.

## Não-escopo

- Autorização por papel nas rotas (todo onboarded usa `/app` e cases).
- Página de gestão de equipe.
- Runner de testes.

## Comportamento

- Login com senha temporária (o e-mail) redireciona para `/app/onboarding`.
- Onboarding exige nova senha diferente do e-mail, telefone e avatar.
- Proxy, layout e APIs autenticadas (`/api/profile`, `/api/cases`) recusam quem não concluiu.
- Cliente não altera `role`, `cargo` nem `onboarding_completed`.

## Arquitetura

```text
lib/validations/profile.ts   domínio
lib/profile.ts               sessão, gate de onboarding
app/api/onboarding           conclusão do primeiro acesso
app/(dashboard)/app/onboarding
proxy.ts                     redireciona incompletos
```

## Banco

`profiles`: role (check), cargo, onboarding_completed.
RPC `complete_profile_onboarding()`. Trigger protege role/cargo.

## Critérios de aceite

- Pedro entra com o e-mail novo, sem onboarding.
- Conta nova cai no onboarding e só depois acessa o dashboard.
- Perfil mostra cargo bloqueado e não mostra role.

## Testes

Não há runner. Lint e fluxo no browser (login → onboarding → perfil).
