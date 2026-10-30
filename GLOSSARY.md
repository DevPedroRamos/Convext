# Convext

Vocabulário do admin e do site: contas comerciais, demandas internas e cases públicos.

## Language

**Cliente**:
Contato comercial cadastrado no admin — corretor ou conta, com empresa e WhatsApp opcional.
_Avoid_: Case, customer, account

**Responsável**:
Membro da equipe dono do Cliente. A Demanda guarda o Responsável vigente no momento do registro.
_Avoid_: owner, assignee escolhido no formulário

**Demanda**:
Pedido interno ligado a um Cliente, classificado por tipo.
_Avoid_: Feedback (como nome da entidade), ticket, task

**Feedback**:
Tipo de Demanda: o que o cliente pediu ou relatou, registrado na página Feedback.
_Avoid_: usar Feedback como nome da entidade persistida

**Mídia**:
Tipo de Demanda: pedido de produção de mídia.
_Avoid_: media, post (como nome do tipo)

**Status**:
Etapa da Demanda: Novo, Briefing, Em progresso ou Concluído.
_Avoid_: state, stage

**Prioridade**:
Urgência da Demanda: Baixa, Média ou Alta.
_Avoid_: urgency, rank

**Prazo**:
Data limite da Demanda.
_Avoid_: deadline como nome da entidade

**Operação**:
Admin ou coordenador — vê e atualiza todas as Demandas.
_Avoid_: staff, manager

**Case**:
Peça pública do site sobre um cliente.
_Avoid_: Cliente
