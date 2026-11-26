# Proposta — Gestão operacional do tráfego no Convext

Data: 2026-11-24 · Status: **proposta** · Origem: análise do repositório `matheusconvext-dotcom/ads-command-center` (ACC), feito pelo gestor de tráfego Matheus.

## 1. Divisão entre Convext e Web Boost

O ACC mistura duas coisas: gestão operacional (clientes, carteiras, gestores, demandas com prazo) e acompanhamento de campanhas (métricas, metas, saldo, alertas). A divisão adotada:

- **Convext:** tudo que depende de pessoas, prazos, clientes como relação comercial e dinheiro da agência.
- **Web Boost:** tudo que depende de dado da Meta (gasto, resultados, saldo, status de campanha). Ver `web-boost/docs/proposals/2026-11-24-financeiro-e-alertas-de-tendencia.md`.

Verba de mídia do cliente **não** entra no financeiro do Convext. O financeiro do Convext continua sendo receita e custo da agência (mensalidade, contratos, folha).

## 2. O que trazer do ACC

### 2.1 Carteira do gestor

- Hoje `clients.responsible_id` já é o vínculo cliente → responsável, mas a role `traffic` não acessa `/app/clientes` (`lib/access.ts`).
- Proposta: o gestor de tráfego vê **os clientes da própria carteira** (só leitura do cadastro; edição continua com admin/coordinator).
- Avaliar se um cliente pode ter mais de um responsável (o ACC permite). Hoje é um só.

### 2.2 Prazos nos Espaços

O ponto mais útil das "Prioridades" do ACC. Hoje "prazos por etapa" está fora do escopo em `docs/specs/espacos.md`.

- Prazo por tarefa (e, depois, por etapa).
- Indicadores: **vencidas**, **vencem hoje**, prioridade alta/crítica, sem responsável.
- Filtros por esses estados nas listas dos Espaços.
- Resolução de alerta com texto mínimo (o ACC exige 10 caracteres) para registrar o que foi feito.

### 2.3 Painel por gestor

Equivalente à aba "Gestores" do ACC, para admin e coordinator:

- Clientes atribuídos a cada gestor.
- Demandas abertas, vencidas e concluídas no período, por gestor.
- Alertas operacionais calculados: "cliente sem responsável", "demanda vencida", "vence hoje".

Ficou de fora o alerta "sem registro no Diário há 7 dias": ausência de anotação não prova ausência de trabalho e gera microgestão.

### 2.4 O que já existe e não precisa recriar

Os Espaços "Campanhas", "Tráfego pago" e "Feedback de clientes" (seed em `20261121214851_spaces.sql`) já cobrem o fluxo de demandas do ACC: pedido de campanha, ajuste (pausar, escalar, trocar público) e resposta a feedback.

## 3. Ponte com o Web Boost (fase posterior)

| Item                      | Como                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Vínculo                   | Conta de anúncios do Web Boost ↔ cliente do Convext por identificador compartilhado. Convext é a fonte de verdade de cliente e responsável; Web Boost de conta e métricas. |
| Alerta → tarefa           | Alerta crítico do Web Boost cria tarefa no Espaço "Tráfego pago", com link para a campanha. É o "criar demanda a partir do sinal Meta" do ACC. |
| Semáforo no cliente       | O cadastro do cliente mostra o estado da carteira lido do Web Boost (só leitura).          |

Depende de contrato de API entre os dois sistemas e autenticação de serviço. Precisa de ADR nos dois projetos antes de começar.

## 4. Ordem sugerida

1. Carteira do gestor (acesso da role `traffic` aos próprios clientes).
2. Prazos nos Espaços (vencidas, vence hoje, filtros).
3. Painel por gestor.
4. Ponte com o Web Boost.

## 5. Decisões abertas

- Um cliente pode ter mais de um gestor responsável?
- Prazo só por tarefa ou também por etapa já na primeira entrega?
- Quem resolve um alerta operacional: só o responsável ou também o coordinator?
