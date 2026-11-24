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

## Comunicação em tempo real

**Sala**:
Espaço persistente em que membros autorizados da equipe podem conversar por voz, vídeo e compartilhamento de tela. Pode estar vazio sem deixar de existir.
_Avoid_: Chamada como sinônimo de Sala

**Sessão de sala**:
Encontro que ocorre em uma Sala, desde sua abertura até seu encerramento. Uma Sala pode receber várias sessões ao longo do tempo.
_Avoid_: Sala como sinônimo de encontro em andamento

**Chamada direta**:
Convite para uma conversa temporária entre duas ou mais pessoas da equipe, com aceite individual e sem criar uma Sala permanente.
_Avoid_: Mensagem direta, Sala permanente

**Participação**:
Presença de uma pessoa em uma sessão de comunicação. Ter acesso a uma Sala não significa estar participando dela.
_Avoid_: Membership como sinônimo de presença em chamada

**Apresentação**:
Compartilhamento ao vivo de uma tela, janela ou aba durante uma sessão de comunicação.
_Avoid_: Case, gravação

**Disponibilidade**:
Indicação manual de disponível ou ausente escolhida pelo membro da equipe; independente de estar conectado ou em chamada.
_Avoid_: Online, Em chamada como equivalentes

## Agenda

**Compromisso**:
Hora marcada ligada a uma tarefa de Espaço, com data, início, duração (padrão 1h), local e participantes. Nasce do campo "Compromisso" do formulário; não existe sem tarefa.
_Avoid_: Evento, reunião (como nome da entidade)

**Participante do compromisso**:
Pessoa da equipe escolhida no formulário que deve comparecer ao Compromisso. É o dono do Compromisso na agenda dela.
_Avoid_: Responsável da tarefa (assignee), que muda a cada etapa

**Local**:
Endereço ou nome do lugar do Compromisso, em texto livre (ex.: "Econ Parque do Carmo").
_Avoid_: Sala (que é da Comunicação)

**Agenda**:
Página `/app/agenda`. O creator vê os próprios Compromissos; coordenador e admin veem os da equipe. Só coordenador e admin remarcam.
_Avoid_: Calendário como nome da área
