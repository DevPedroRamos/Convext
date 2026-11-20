import { describe, expect, it } from "vitest";
import { areaFromPath, canAccessPath } from "@/lib/access";

describe("acesso ao financeiro", () => {
  it("separa as rotas comerciais das administrativas", () => {
    expect(areaFromPath("/app/financeiro")).toBe("financeiro_comercial");
    expect(areaFromPath("/app/financeiro/leads")).toBe("financeiro_comercial");
    expect(areaFromPath("/app/financeiro/admin")).toBe("financeiro_admin");
    expect(areaFromPath("/app/financeiro/admin/folha")).toBe("financeiro_admin");
    expect(areaFromPath("/app/financeiro/administracao")).toBe("financeiro_comercial");
  });

  it("libera o comercial para commercial e admin e o administrativo só para admin", () => {
    expect(canAccessPath("commercial", "/app/financeiro/contratos")).toBe(true);
    expect(canAccessPath("commercial", "/app/financeiro/admin/balanco")).toBe(false);
    expect(canAccessPath("admin", "/app/financeiro/admin/balanco")).toBe(true);
    for (const role of ["coordinator", "traffic", "creator"]) {
      expect(canAccessPath(role, "/app/financeiro")).toBe(false);
    }
  });
});
