import { describe, expect, it } from "vitest";
import { areaFromPath, canAccessPath } from "@/lib/access";

describe("acesso da agenda", () => {
  it("mapeia /app/agenda para a área agenda", () => {
    expect(areaFromPath("/app/agenda")).toBe("agenda");
  });

  it("libera admin, coordenador e creator e bloqueia tráfego e comercial", () => {
    expect(canAccessPath("admin", "/app/agenda")).toBe(true);
    expect(canAccessPath("coordinator", "/app/agenda")).toBe(true);
    expect(canAccessPath("creator", "/app/agenda")).toBe(true);
    expect(canAccessPath("traffic", "/app/agenda")).toBe(false);
    expect(canAccessPath("commercial", "/app/agenda")).toBe(false);
  });
});
