import { describe, expect, it } from "vitest";
import { canAccessPath } from "@/lib/access";

describe("logs administrativos", () => {
  it("só admin abre a página de logs", () => {
    expect(canAccessPath("admin", "/app/gestao/logs")).toBe(true);
    expect(canAccessPath("coordinator", "/app/gestao/logs")).toBe(false);
    expect(canAccessPath("traffic", "/app/gestao/logs")).toBe(false);
    expect(canAccessPath("commercial", "/app/equipe")).toBe(false);
  });
});
