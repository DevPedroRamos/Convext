import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canAccessArea } from "@/lib/access";
import { canManageEmployeeRole, employeeSchema, inviteAccessRole, lastAdminBlocked } from "@/lib/validations/employee";

const validEmployee = {
  firstName: "Ana",
  lastName: "Silva",
  email: "ana@example.com",
  phone: "11 99999-9999",
  role: "commercial" as const,
  cargo: "Comercial",
  hiredOn: "2026-11-18",
  employmentStatus: "active" as const,
  contractType: "pj" as const,
  paymentModel: "fixed_commission" as const,
  fixedAmount: 3000,
  commissionPercent: 5,
  additionalAmount: 250,
  paymentDay: 5,
};

describe("gestão de funcionários", () => {
  it("limita Comercial a Dashboard, Espaços, Salas, Perfil e Financeiro comercial", () => {
    expect(canAccessArea("commercial", "dashboard")).toBe(true);
    expect(canAccessArea("commercial", "salas")).toBe(true);
    expect(canAccessArea("commercial", "perfil")).toBe(true);
    expect(canAccessArea("commercial", "espacos")).toBe(true);
    expect(canAccessArea("commercial", "clientes")).toBe(false);
    expect(canAccessArea("commercial", "equipe")).toBe(false);
    expect(canAccessArea("commercial", "gestao")).toBe(false);
    expect(canAccessArea("commercial", "financeiro_comercial")).toBe(true);
    expect(canAccessArea("commercial", "financeiro_admin")).toBe(false);
  });

  it("aceita o contrato financeiro estruturado", () => {
    expect(employeeSchema.safeParse(validEmployee).success).toBe(true);
  });

  it("exige os componentes do modelo fixo com comissão", () => {
    const result = employeeSchema.safeParse({ ...validEmployee, fixedAmount: null, commissionPercent: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fixedAmount).toBeDefined();
      expect(result.error.flatten().fieldErrors.commissionPercent).toBeDefined();
    }
  });

  it("permite editar qualquer role, inclusive admin", () => {
    expect(canManageEmployeeRole("admin")).toBe(true);
    expect(canManageEmployeeRole("commercial")).toBe(true);
  });

  it("bloqueia desativar a si mesmo ou o último admin", () => {
    expect(lastAdminBlocked({ actorId: "a", targetId: "a", currentRole: "admin", currentActive: true, nextRole: "admin", nextActive: false, activeAdminCount: 3 })).toBe("Você não pode desativar o próprio acesso.");
    expect(lastAdminBlocked({ actorId: "a", targetId: "b", currentRole: "admin", currentActive: true, nextRole: "creator", nextActive: true, activeAdminCount: 1 })).toBe("Não é possível remover o último administrador.");
    expect(lastAdminBlocked({ actorId: "a", targetId: "b", currentRole: "admin", currentActive: true, nextRole: "admin", nextActive: true, activeAdminCount: 1 })).toBeNull();
  });

  it("grava admin no convite pelo perfil ou pelo cargo", () => {
    expect(inviteAccessRole("admin", "Head")).toBe("admin");
    expect(inviteAccessRole("traffic", "Admin")).toBe("admin");
    expect(inviteAccessRole("traffic", "Gestor de tráfego")).toBe("traffic");
    expect(employeeSchema.safeParse({ ...validEmployee, role: "admin", cargo: "Admin" }).success).toBe(true);
  });

  it("grava last_seen_at para presença real", () => {
    const sql = readFileSync("supabase/migrations/20261119232905_team_presence_last_seen.sql", "utf8");
    expect(sql).toContain("last_seen_at timestamptz");
    expect(sql).toContain("'lastSeenAt', p.last_seen_at");
  });

  it("protege admins e dados financeiros na migration", () => {
    const sql = readFileSync("supabase/migrations/20261118222248_employee_management.sql", "utf8");
    expect(sql).toContain("create table public.employee_records");
    expect(sql).toContain("protect_admin_employee_record");
    const logs = readFileSync("supabase/migrations/20261123233355_admin_logs.sql", "utf8");
    expect(logs).toContain("service_role");
    expect(logs).toContain("platform_events");
    expect(sql).toContain("employee_access_is_active");
    expect(sql).toContain("'commercial'");
    expect(sql).toContain("enable row level security");
  });
});
