import { describe, expect, it } from "vitest";
import { toAppointmentIso, toAppointmentParts } from "@/components/spaces/appointment-field";

describe("data e hora do compromisso", () => {
  it("não emite ISO enquanto data ou hora estiverem incompletas", () => {
    expect(toAppointmentIso("2026-11-25", "")).toBe("");
    expect(toAppointmentIso("", "14:00")).toBe("");
    expect(toAppointmentIso("", "")).toBe("");
    expect(toAppointmentIso("2026-11-25", "14")).toBe("");
  });

  it("emite ISO só com data e hora completas e devolve as mesmas partes locais", () => {
    const iso = toAppointmentIso("2026-11-25", "14:00");
    expect(iso).toBeTruthy();
    expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
    expect(toAppointmentParts(iso)).toEqual({ date: "2026-11-25", time: "14:00" });
  });

  it("rascunho parcial não zera o outro campo no round-trip", () => {
    const dateOnly = toAppointmentIso("2026-11-25", "");
    const timeOnly = toAppointmentIso("", "09:15");
    expect(dateOnly).toBe("");
    expect(timeOnly).toBe("");
    expect(toAppointmentIso("2026-11-25", "09:15")).toBeTruthy();
    expect(toAppointmentParts(toAppointmentIso("2026-11-25", "09:15"))).toEqual({
      date: "2026-11-25",
      time: "09:15",
    });
  });
});
