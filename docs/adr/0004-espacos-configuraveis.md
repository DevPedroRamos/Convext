# Espaços configuráveis no lugar de Demandas e Feedback

Data: 2026-11-21
Status: accepted

## Contexto

Demandas e Feedback usavam uma tabela com `kind` fixo e regras por role escritas no código (ADRs 0001 e 0002). Cada novo fluxo, como o de campanha nova (creator → tráfego → aprovação do admin), exigia migration, funções de permissão e telas próprias. O time quer configurar fluxos como no ClickUp, mas sob medida.

## Decisão

- Trocar `demands`, `feedback_types` e `demand_files` por espaços configuráveis: `spaces`, `space_stages`, `space_forms`, `space_tasks`, `space_task_events`, `notifications` e `quick_actions`. As demandas antigas foram descartadas (plataforma em implantação).
- O dono de cada etapa é uma role atual ou "quem solicitou". Não há tabela de cargos.
- Uma tarefa conjunta é uma tarefa só que passa de dono em dono pelas etapas. Não há subtarefas.
- As regras do fluxo ficam no banco, em funções security definer. A interface só espelha as regras para decidir o que mostrar (`lib/spaces/rules.ts`).
- Os campos de formulário e os valores da tarefa ficam em JSON, então criar um formulário novo não exige migration.

## Consequências

- O admin cria espaços, fluxos, formulários e atalhos sem deploy.
- Relatórios que filtram por campos específicos de formulário precisam ler o JSON.
- Mudar a semântica do fluxo (novo tipo de etapa, nova ação automática) continua exigindo migration nas funções `space_*` e o espelho em `lib/spaces/rules.ts`.
- Substitui os ADRs 0001 e 0002.
