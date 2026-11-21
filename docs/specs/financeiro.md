# SPEC — Workspace Financeiro

## Problema

Leads do site, propostas, contratos, cobrança, folha e despesas viviam fora da plataforma. A tabela `contacts` recebia os leads da landing, mas ninguém os via no app, e a remuneração cadastrada em [[equipe]] não virava pagamento.

## Objetivo

Um workspace **Financeiro**, recolhível na sidebar, com duas seções:

- **Comercial** (`commercial` e `admin`): dashboard, propostas, leads, contratos, clientes financeiros e produtos.
- **Administrativo** (só `admin`): dashboard gerencial, folha, balanço e gestão.

## Escopo

- Funil de leads: leads da landing (`contacts`) e cadastro manual (indicação, WhatsApp), com responsável, valor estimado, etapas `new → contacted → qualified → proposal → won/lost` e arquivamento.
- Conversão lead → cliente financeiro (`finance_customers`), uma tabela separada de `clients` com vínculo opcional à conta operacional.
- Produtos mensais ou avulsos com preço padrão.
- Propostas com itens mensais e avulsos (parceláveis em até 60x). O aceite cria o contrato numa única transação (`finance_accept_proposal`) e converte o lead, se for o caso.
- Contratos com mensalidade (soma dos itens mensais, mantida por trigger), itens avulsos, vendedor (comissão), início/fim, dia de vencimento, pausa, encerramento e cancelamento.
- Parcelas a receber geradas por mês, de forma idempotente, com baixa (data e valor recebido), reabertura e cancelamento.
- Folha mensal gerada de `employee_records`: fixo, comissão (percentual × recebido no mês nos contratos em que a pessoa é vendedora) e adicional; bônus e descontos manuais; rascunho → fechada → paga.
- Despesas categorizadas, recorrentes (copiadas do mês anterior) e balanço em **regime de caixa** (pela data de pagamento).
- Dashboards com MRR, funil, cobrança do mês, atrasos, fluxo de caixa de 12 meses e maiores clientes.

## Não-escopo

- Emissão de boleto/Pix, nota fiscal e conciliação bancária.
- Regime de competência e DRE contábil.
- Encargos trabalhistas (INSS, FGTS) na folha.
- Folha de pessoas com role `admin`: a RLS de `employee_records` oculta esses registros, então sócios não entram na folha gerada.
- Reajuste automático de contratos.

## Acesso

| Área | admin | commercial | coordinator | traffic | creator |
|---|---|---|---|---|---|
| `/app/financeiro/*` (comercial) | sim | sim | não | não | não |
| `/app/financeiro/admin/*` | sim | não | não | não | não |

- `lib/access.ts`: áreas `financeiro_comercial` e `financeiro_admin`. O proxy aplica sem mudanças.
- APIs `/api/finance/*` usam `requireAreaAccess`. Exclusões exigem admin também na API, porque a RLS ignoraria o DELETE em silêncio.
- RLS: `profile_is_finance_commercial()` (admin ou commercial) nas tabelas comerciais; folha, despesas e categorias só `profile_is_admin()`.

## Arquitetura

```text
supabase/migrations/20261120120000_finance.sql   schema, RLS, finance_convert_lead, finance_accept_proposal
lib/finance/dates.ts | money.ts                  datas ISO em UTC, centavos
lib/finance/receivables.ts                       parcelas do mês (mensal + avulso)
lib/finance/payroll.ts                           linha da folha por modelo de pagamento
lib/finance/metrics.ts                           fluxo de caixa, MRR, funil, conversão
lib/finance/data.ts                              acesso a dados (server-only)
lib/finance/http.ts                              guard/parse/respond das rotas
lib/validations/finance.ts                       zod (formulários em reais; banco em centavos)
app/api/finance/*                                rotas REST + ações (accept, convert, generate, build)
app/(dashboard)/app/financeiro/*                 páginas
components/finance/*                             tabelas, formulários, gráficos (recharts)
components/dashboard/sidebar-nav.tsx             grupo Financeiro recolhível
```

## Decisões

- **Centavos em `bigint`**, como em `employee_records`. Os formulários trabalham em reais e a API converte.
- **Cálculo em TypeScript, ações atômicas em SQL.** A geração de parcelas, a folha e as métricas são funções puras testadas (`tests/finance`). As ações com várias escritas (converter lead, aceitar proposta) são funções `security invoker`, então a RLS continua valendo.
- **Idempotência das parcelas** por `unique (contract_id, source_key, competence)`: `source_key = 'recurring'` para a mensalidade ou o id do item avulso.
- **Vencimento**: dias 29–31 caem no último dia em meses curtos; no mês de início, um vencimento anterior à data de início passa para o mês seguinte.
- **Tipos**: as tabelas `finance_*` ainda não estão em `types/database.types.ts`. `lib/finance/data.ts` usa o client sem o genérico `Database`, como o store da memória. Regenere os tipos depois de aplicar a migration.

## Critérios de aceite

- Commercial vê o grupo Financeiro só com a seção Comercial; `/app/financeiro/admin` redireciona para `/app`.
- Lead manual → proposta → aceitar gera contrato, converte o lead em cliente e o marca como ganho.
- “Gerar parcelas do mês” duas vezes não duplica parcelas.
- Baixa de parcela aparece no balanço do mês do pagamento e no dashboard.
- Gerar a folha calcula a comissão do vendedor sobre o que foi recebido no mês e mantém bônus e descontos ao recalcular.

## Riscos

- A migration precisa ser aplicada no Supabase antes do deploy. Sem ela, as páginas carregam vazias e as ações falham.
- Ao estender o check de status de `contacts`, os valores antigos (`new`, `contacted`, `qualified`, `archived`) continuam válidos.
