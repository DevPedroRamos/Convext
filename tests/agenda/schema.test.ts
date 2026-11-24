import { describe, expect, it } from "vitest";
import { appointmentInputSchema, createTaskSchema, taskActionSchema } from "@/lib/validations/spaces";

const valid = {
  startsAt: "2026-11-24T13:00:00.000Z",
  durationMinutes: 60,
  location: "Econ Parque do Carmo",
  attendeeIds: ["8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11"],
};

describe("schema de compromisso", () => {
  it("aceita o payload válido e aplica 60 min por padrão", () => {
    const { durationMinutes: _ignored, ...withoutDuration } = valid;
    expect(appointmentInputSchema.parse(withoutDuration).durationMinutes).toBe(60);
    expect(appointmentInputSchema.safeParse({ ...valid, location: "x".repeat(201) }).success).toBe(false);
    expect(appointmentInputSchema.safeParse({ ...valid, attendeeIds: [] }).success).toBe(false);
    expect(appointmentInputSchema.safeParse({ ...valid, durationMinutes: 10 }).success).toBe(false);
  });

  it("entra no envio da tarefa e nas ações de remarcar", () => {
    expect(createTaskSchema.safeParse({ formId: valid.attendeeIds[0], title: "Visita", values: {}, appointment: valid }).success).toBe(true);
    expect(taskActionSchema.safeParse({ action: "reschedule", appointment: valid }).success).toBe(true);
    expect(taskActionSchema.safeParse({ action: "unschedule" }).success).toBe(true);
  });
});
