import { describe, expect, it } from "vitest";
import { canAccessPath } from "@/lib/access";
import { parseGallery } from "@/lib/spaces/gallery";
import { canAct, canClaim, canReschedule, canSeeSpace, canSubmitForm, firstMissingField, flowProblems, isMyTurn, missingRequirement, nextStage, rejectTarget, reworkTarget } from "@/lib/spaces/rules";
import type { Space, SpaceStage } from "@/lib/spaces/types";
import { spaceFormSchema, taskActionSchema } from "@/lib/validations/spaces";

const stage = (id: string, position: number, extra: Partial<SpaceStage> = {}): SpaceStage => ({ id, spaceId: "s", name: id, position, type: "normal", ownerRole: "coordinator", requiresLabel: null, notify: true, rejectTo: null, ...extra });
const space: Space = {
  id: "s",
  name: "Campanhas",
  color: "#f35703",
  memberRoles: ["admin", "coordinator", "creator", "traffic"],
  position: 0,
  stages: [
    stage("arte", 1, { ownerRole: "creator", requiresLabel: "Link da arte" }),
    stage("solicitada", 0),
    stage("aprovacao", 3, { type: "approval", ownerRole: "admin", rejectTo: "arte" }),
    stage("campanha", 2, { ownerRole: "traffic" }),
    stage("fim", 4, { type: "done", ownerRole: null }),
  ],
};
const byId = (id: string) => space.stages.find((item) => item.id === id)!;
const lara = { id: "lara", role: "commercial" as const };
const carla = { id: "carla", role: "coordinator" as const };
const davi = { id: "davi", role: "creator" as const };
const pedro = { id: "pedro", role: "admin" as const };
const task = { createdBy: "lara", assigneeId: null as string | null, values: {} as Record<string, string> };

describe("fluxo", () => {
  it("segue a ordem das etapas, não a ordem da lista", () => {
    expect(nextStage(space, "solicitada")?.id).toBe("arte");
    expect(nextStage(space, "aprovacao")?.id).toBe("fim");
    expect(nextStage(space, "fim")).toBeNull();
  });

  it("recusa volta para a etapa configurada ou para a anterior", () => {
    expect(rejectTarget(space, byId("aprovacao"))?.id).toBe("arte");
    expect(rejectTarget(space, { ...byId("aprovacao"), rejectTo: null })?.id).toBe("campanha");
  });

  it("reajuste admin usa o destino da última aprovação", () => {
    expect(reworkTarget(space)?.id).toBe("arte");
    const semAprovacao: Space = { ...space, stages: space.stages.filter((item) => item.type !== "approval") };
    expect(reworkTarget(semAprovacao)?.id).toBe("campanha");
  });

  it("só o dono da etapa age; o admin age em tudo", () => {
    expect(canAct(task, byId("solicitada"), carla)).toBe(true);
    expect(canAct(task, byId("solicitada"), lara)).toBe(false);
    expect(canAct(task, byId("solicitada"), davi)).toBe(false);
    expect(canAct(task, byId("arte"), pedro)).toBe(true);
    expect(canAct(task, byId("fim"), pedro)).toBe(false);
  });

  it("quem pegou a tarefa passa a ser o único a agir", () => {
    const claimed = { ...task, assigneeId: "davi" };
    expect(canAct(claimed, byId("arte"), davi)).toBe(true);
    expect(canAct(claimed, byId("arte"), { id: "bia", role: "creator" })).toBe(false);
    expect(canClaim(claimed, byId("arte"), { id: "bia", role: "creator" })).toBe(false);
    expect(canClaim(task, byId("arte"), davi)).toBe(true);
  });

  it("dono 'quem solicitou' é só quem abriu", () => {
    const requester = stage("ajuste", 0, { ownerRole: "requester" });
    expect(canAct(task, requester, lara)).toBe(true);
    expect(canAct(task, requester, { id: "outra", role: "commercial" })).toBe(false);
  });

  it("a vez do admin são só as etapas dele", () => {
    expect(isMyTurn(task, byId("arte"), pedro)).toBe(false);
    expect(isMyTurn(task, byId("aprovacao"), pedro)).toBe(true);
    expect(isMyTurn(task, byId("arte"), davi)).toBe(true);
  });

  it("cobra a informação exigida para concluir", () => {
    expect(missingRequirement(task, byId("arte"))).toBe("Link da arte");
    expect(missingRequirement({ values: { "Link da arte": "drive/x" } }, byId("arte"))).toBeNull();
  });

  it("membros veem o espaço; os demais só o que abriram", () => {
    expect(canSeeSpace(space, carla)).toBe(true);
    expect(canSeeSpace(space, lara)).toBe(false);
    expect(canSeeSpace(space, pedro)).toBe(true);
  });

  it("aponta problemas na configuração do fluxo", () => {
    expect(flowProblems([{ name: "A", type: "normal", ownerRole: "admin" }, { name: "B", type: "done", ownerRole: null }])).toEqual([]);
    expect(flowProblems([{ name: "A", type: "normal", ownerRole: "admin" }, { name: "B", type: "normal", ownerRole: "admin" }])).toContain("A última etapa precisa ser do tipo Concluída.");
    expect(flowProblems([{ name: "A", type: "normal", ownerRole: null }, { name: "B", type: "done", ownerRole: null }])).toContain("Toda etapa que não é a final precisa de um dono.");
    expect(flowProblems([{ name: "A", type: "approval", ownerRole: "admin" }, { name: "B", type: "done", ownerRole: null }])).toContain("A primeira etapa não pode ser de aprovação.");
  });
});

describe("formulários", () => {
  const fields = [
    { key: "titulo", label: "Nome", type: "text" as const, required: true },
    { key: "cliente", label: "Cliente", type: "client" as const, required: true },
    { key: "briefing", label: "Briefing", type: "longtext" as const, required: true },
    { key: "verba", label: "Verba", type: "number" as const, required: false },
  ];

  it("exige campos obrigatórios e o cliente", () => {
    expect(firstMissingField(fields, { titulo: "Natal", briefing: "x" }, null)).toBe("Cliente");
    expect(firstMissingField(fields, { titulo: "Natal" }, "c1")).toBe("Briefing");
    expect(firstMissingField(fields, { titulo: "Natal", briefing: "x" }, "c1")).toBeNull();
  });

  it("respeita o público e o status do formulário", () => {
    expect(canSubmitForm({ audienceRoles: ["commercial"], active: true }, "commercial")).toBe(true);
    expect(canSubmitForm({ audienceRoles: ["commercial"], active: true }, "creator")).toBe(false);
    expect(canSubmitForm({ audienceRoles: [], active: true }, "admin")).toBe(true);
    expect(canSubmitForm({ audienceRoles: ["admin"], active: false }, "admin")).toBe(false);
  });

  it("valida a configuração do formulário", () => {
    const base = { spaceId: "8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11", name: "Pedido", description: "", audienceRoles: ["admin"], active: true };
    expect(spaceFormSchema.safeParse({ ...base, fields }).success).toBe(true);
    expect(spaceFormSchema.safeParse({ ...base, fields: fields.slice(1) }).success).toBe(false);
    expect(spaceFormSchema.safeParse({ ...base, fields: [...fields, { ...fields[1], key: "cliente2" }] }).success).toBe(false);
    expect(spaceFormSchema.safeParse({ ...base, audienceRoles: [], fields }).success).toBe(false);
    expect(spaceFormSchema.safeParse({ ...base, fields: [...fields, { key: "tipo", label: "Tipo", type: "feedback", required: true }] }).success).toBe(true);
    expect(
      spaceFormSchema.safeParse({
        ...base,
        fields: [
          ...fields,
          { key: "tipo", label: "Tipo", type: "feedback", required: true },
          { key: "tipo2", label: "Tipo 2", type: "feedback", required: false },
        ],
      }).success,
    ).toBe(false);
  });

  it("exige o tipo de feedback obrigatório", () => {
    const feedbackFields = [
      { key: "titulo", label: "Nome", type: "text" as const, required: true },
      { key: "tipo", label: "Tipo de feedback", type: "feedback" as const, required: true },
    ];
    expect(firstMissingField(feedbackFields, { titulo: "Lead ruim" }, null)).toBe("Tipo de feedback");
    expect(firstMissingField(feedbackFields, { titulo: "Lead ruim", tipo: "renda baixa" }, null)).toBeNull();
  });

  it("aceita galeria e exige imagens quando obrigatória", () => {
    const galleryFields = [
      { key: "titulo", label: "Nome", type: "text" as const, required: true },
      { key: "imagens", label: "Imagens", type: "gallery" as const, required: true },
    ];
    const base = { spaceId: "8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11", name: "Pedido", description: "", audienceRoles: ["admin"], active: true };
    expect(spaceFormSchema.safeParse({ ...base, fields: galleryFields }).success).toBe(true);
    expect(firstMissingField(galleryFields, { titulo: "Print", imagens: "[]" }, null)).toBe("Imagens");
    expect(firstMissingField(galleryFields, { titulo: "Print", imagens: JSON.stringify(["https://cdn.example/a.jpg"]) }, null)).toBeNull();
  });

  it("lê URLs da galeria e ignora lista vazia", () => {
    expect(parseGallery("")).toEqual([]);
    expect(parseGallery("[]")).toEqual([]);
    expect(parseGallery(JSON.stringify(["https://cdn.example/a.jpg", "ftp://x"]))).toEqual(["https://cdn.example/a.jpg"]);
  });

  it("exige motivo ao recusar", () => {
    expect(taskActionSchema.safeParse({ action: "reject", reason: "" }).success).toBe(false);
    expect(taskActionSchema.safeParse({ action: "reject", reason: "Trocar foto" }).success).toBe(true);
  });

  it("aceita edição e reajuste do admin", () => {
    expect(taskActionSchema.safeParse({ action: "update", title: "Nova arte", values: { briefing: "x" }, assigneeId: null, clientId: null }).success).toBe(true);
    expect(taskActionSchema.safeParse({ action: "update", title: "A" }).success).toBe(false);
    expect(taskActionSchema.safeParse({ action: "rework", reason: "ok" }).success).toBe(false);
    expect(taskActionSchema.safeParse({ action: "rework", reason: "Ajustar o corte" }).success).toBe(true);
  });

  it("aceita no máximo um campo de compromisso e cobra o agendamento obrigatório", () => {
    const appointmentFields = [
      { key: "titulo", label: "Nome", type: "text" as const, required: true },
      { key: "quando", label: "Compromisso", type: "appointment" as const, required: true },
    ];
    const base = { spaceId: "8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11", name: "Pedido", description: "", audienceRoles: ["admin"], active: true };
    expect(spaceFormSchema.safeParse({ ...base, fields: appointmentFields }).success).toBe(true);
    expect(
      spaceFormSchema.safeParse({
        ...base,
        fields: [...appointmentFields, { key: "quando2", label: "Outro", type: "appointment", required: false }],
      }).success,
    ).toBe(false);
    expect(firstMissingField(appointmentFields, { titulo: "Visita" }, null)).toBe("Compromisso");
    expect(firstMissingField(appointmentFields, { titulo: "Visita" }, null, { startsAt: "2026-11-24T13:00:00.000Z", durationMinutes: 60, location: "", attendeeIds: ["8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11"] })).toBeNull();
  });

  it("só coordenador e admin remarcam", () => {
    expect(canReschedule("admin")).toBe(true);
    expect(canReschedule("coordinator")).toBe(true);
    expect(canReschedule("creator")).toBe(false);
  });
});

describe("acesso", () => {
  it("todos os papéis acessam os espaços; configuração só admin", () => {
    for (const role of ["admin", "coordinator", "traffic", "creator", "commercial"]) {
      expect(canAccessPath(role, "/app/tarefas")).toBe(true);
      expect(canAccessPath(role, "/app/espacos/abc")).toBe(true);
    }
    expect(canAccessPath("coordinator", "/app/gestao/espacos")).toBe(false);
    expect(canAccessPath("admin", "/app/gestao/formularios")).toBe(true);
  });
});
