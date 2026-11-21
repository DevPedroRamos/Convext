# SPEC — Gestão de equipe, presença e status

## Problema

A área precisa reunir o diretório do time, presença e a gestão administrativa de funcionários sem expor dados contratuais e financeiros aos demais usuários.

## Objetivo

Cada pessoa marca Disponível/Ausente e escolhe um status atual. A bolinha verde só aparece se a pessoa está Disponível e com a área aberta. Admin vê a equipe, convida, edita e desativa funcionários não-admin, além de administrar os status.

## Escopo

- Presença em dois sinais: `available` (intenção no switch/popup) e `last_seen_at` (heartbeat da aba `/app`, inclusive em segundo plano). Verde = os dois. Fechar a última aba, crash ou 5 minutos sem sinal = Offline. Sair grava Ausente.
- Status atual (`status_id`) escolhido pelo próprio usuário na lista criada pelo admin. Aparece no trigger do perfil. Pode ficar vazio.
- Catálogo `team_statuses` com seed: Modo foco, Em reunião, Poucas demandas.
- `/app/equipe` só admin: cards (avatar, nome, cargo, e-mail, presença, status). O CRUD do catálogo de status fica em `/app/gestao` (spec Criativos).
- Cada card não-admin tem ações com ícone para editar e excluir. Editar abre um `Sheet` à direita; excluir desativa o acesso e preserva o histórico.
- “Adicionar funcionário” abre um modal em três etapas, envia convite por e-mail e não navega para outra página.
- Dados do funcionário: nome, sobrenome, e-mail, telefone, role, cargo, data de entrada, status Ativo/Inativo, tipo de contrato e financeiro.
- Tipos de contrato: CLT, PJ, Freelancer e Sócio (adm).
- Financeiro: modelo Fixo, Comissão, Fixo + comissão ou Personalizado; fixo em R$, comissão em %, adicional em R$ e dia mensal de pagamento.
- Role `commercial`: acesso a Dashboard, Salas, Perfil e à seção Comercial do Financeiro ([[financeiro]]). O cargo Comercial pode ser usado com essa role.
- A remuneração cadastrada aqui gera a folha mensal em `/app/financeiro/admin/folha`.
- Card Equipe do dashboard aponta para `/app/equipe`.

## Não-escopo

- Auto-ausente por inatividade com a aba ainda aberta (timer em background continua Online).
- Exclusão física de contas ou do histórico relacionado.
- Coordinator na página Equipe.
- Editar ou desativar usuários com role `admin`.

## Comportamento

- Todo mundo começa Ausente (`available` default false).
- Ao autenticar, a área mostra um popup obrigatório: escolher Disponível ou Ausente e confirmar. Sem confirmar, permanece Ausente.
- Switch ligado = Disponível. Desligado = Ausente (cinza, ainda na plataforma). Continua no menu depois do login.
- Heartbeat a cada ~60s. Equipe, Salas e menu atualizam a bolinha sem F5 (~20s). Fechar a última aba zera `last_seen_at`. Crash/sleep cai Offline em 5 minutos.
- Voltar com `available` ainda true reacende o verde sem o popup. Sair grava Ausente e o popup volta no próximo login.
- Offline esconde o status (Em reunião / Modo foco) e mostra o rótulo Offline.
- Trocar presença ou status grava no próprio `profiles` e atualiza o menu.
- Admin cria/edita/exclui status em Gestão da plataforma (nome + ícone Lucide). Excluir zera o `status_id` de quem usava.
- Traffic/creator não veem Equipe no sidebar; `/app/equipe` cai no dashboard. O menu ainda troca presença e status.
- Cadastro cria a conta pelo Auth Admin, gera o link de convite e envia o e-mail pelo Resend. O trigger cria `profiles`; a operação administrativa completa role, cargo e ficha funcional.
- O convite abre `/app/confirmar`: nome, e-mail e cargo somente leitura, mais a senha. Depois, `/app/onboarding` pede foto e telefone.
- O cadastro tem etapas: dados pessoais e acesso; contrato; financeiro e revisão.
- Edição de funcionário acontece no painel lateral e sincroniza o e-mail entre Auth e `profiles`.
- Excluir é uma desativação lógica: status Inativo, presença Ausente e bloqueio no Auth. Reativar remove o bloqueio.
- A aplicação e as APIs recusam funcionários inativos mesmo enquanto um token antigo ainda estiver válido.
- Admins continuam visíveis, mas nunca recebem ações de editar ou excluir.

## Arquitetura

```text
lib/access.ts                    área equipe
lib/team-status.ts               catálogo e labels
lib/profile.ts                   sessão e gates
lib/employees.ts                 gestão administrativa
lib/validations/employee.ts      contratos de entrada
lib/presence.ts                  online vs ausente vs offline
app/api/me/presence|status|heartbeat
app/api/presence/team
app/api/team-statuses
app/api/equipe
app/(dashboard)/app/equipe
components/dashboard/team-board
components/dashboard/user-menu
components/dashboard/presence-prompt
components/dashboard/presence-runtime
```

## Banco

`team_statuses`: id, name, icon, sort_order, timestamps.

`profiles.available` boolean default false. `profiles.last_seen_at` timestamptz nullable. `profiles.status_id` uuid nullable FK on delete set null.

`employee_records`: vínculo 1:1 com `profiles`, data de entrada, status funcional, tipo de contrato, modelo de pagamento, valores em centavos, comissão percentual, dia de pagamento e timestamps.

RLS: dados funcionais/financeiros somente para admin. Uma função restrita retorna apenas se o usuário atual está ativo. Trigger e validação de servidor impedem mutações de admins.

## Critérios de aceite

- Admin vê Equipe no sidebar, cards do time e consegue criar um status.
- Login abre o popup de presença; confirmar grava Disponível ou Ausente.
- Menu, Equipe e Salas mostram verde só com Disponível + heartbeat fresco; Offline esconde o status.
- Menu mostra bolinha, status atual, switch e lista de status.
- Traffic não abre `/app/equipe`. Continua alterando presença e status.
- Admin cadastra em modal com etapas e o convite é enviado pelo Resend.
- Admin edita funcionário não-admin no painel lateral.
- Admin não vê ações em cards de outros admins e a API também recusa essas operações.
- Excluir torna o funcionário Inativo e bloqueia o acesso sem apagar histórico.
- Comercial entra somente em Dashboard, Salas e Perfil.
- Valores financeiros não ficam disponíveis na leitura geral de `profiles`.

## Testes

Vitest para acesso, validações e invariantes puras. Lint, build e browser para cadastro, edição, desativação, reativação e permissões.

## Riscos

- Auth e Postgres não compartilham transação; criação e alteração de e-mail precisam de compensação e mensagens de falha parcial.
- Banimento no Auth pode não invalidar imediatamente um access token; o gate de status na aplicação continua obrigatório.
- A migration deve ser aplicada antes da interface administrativa entrar em produção.
