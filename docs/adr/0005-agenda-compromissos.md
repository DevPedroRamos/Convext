# Agenda de compromissos ligada às tarefas dos Espaços

Data: 2026-11-23
Status: accepted

## Contexto

Creators precisam ver os próprios compromissos (gravações, visitas, reuniões com cliente), e coordenação e admin precisam ver os da equipe toda. Esses compromissos nascem de demandas abertas por formulário nos Espaços. Os valores da tarefa ficam em JSON (`space_tasks.values`), que não serve para buscar por intervalo de datas nem para aplicar RLS por pessoa. O responsável da tarefa (`assignee_id`) é zerado a cada troca de etapa, então ele não serve como dono do compromisso.

## Decisão

- O compromisso fica em tabela própria, `task_appointments` (1:1 com `space_tasks`), e os participantes ficam em `task_appointment_attendees`. Não vai no JSON `values`.
- O compromisso nasce do formulário que abre a tarefa, num campo do tipo `appointment` ("Compromisso"), com no máximo um por formulário. Tarefa e compromisso são criados na mesma transação, em `space_create_task`.
- Campos: data, hora de início, duração (padrão de 60 min, editável), local em texto livre (endereço ou nome do lugar, por exemplo "Econ Parque do Carmo") e participantes.
- O dono do compromisso é cada participante escolhido no formulário (pelo menos um). A agenda de cada pessoa mostra os compromissos em que ela é participante.
- Leitura: admin e coordenador veem todos os compromissos; o creator vê só aqueles em que participa. Tráfego e comercial não têm a área Agenda.
- Quem participa de um compromisso também pode abrir a tarefa ligada a ele (`space_task_visible`).
- Só coordenador e admin remarcam ou removem um compromisso. Toda mudança é registrada no histórico da tarefa e avisa os participantes.
- O formulário abre no drawer lateral direito (`Sheet size="panel"`), como o resto da plataforma. Não se cria compromisso solto pela agenda.

## Consequências

- O calendário consulta compromissos por intervalo com índice, e a RLS fica simples.
- Compromisso sem demanda não existe; quem quiser agendar abre uma demanda.
- Ficam fora de escopo: lembretes automáticos, aviso de conflito de horário, remarcar arrastando no calendário e exportar para Google Calendar/.ics.
