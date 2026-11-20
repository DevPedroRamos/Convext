import { describe, expect, it } from "vitest";
import { hasPasswordSet } from "@/lib/profile";
import { canAccessPath } from "@/lib/access";
import { inviteConfirmSchema, isPasswordSameAsEmail, onboardingSchema } from "@/lib/validations/profile";

describe("confirmação de convite", () => {
  it("aceita senhas iguais com no mínimo 8 caracteres", () => {
    expect(inviteConfirmSchema.safeParse({ password: "convext1", confirmPassword: "convext1" }).success).toBe(true);
  });

  it("rejeita senhas diferentes ou curtas", () => {
    expect(inviteConfirmSchema.safeParse({ password: "convext1", confirmPassword: "convext2" }).success).toBe(false);
    expect(inviteConfirmSchema.safeParse({ password: "short", confirmPassword: "short" }).success).toBe(false);
  });

  it("rejeita senha igual ao e-mail", () => {
    expect(isPasswordSameAsEmail("Ana@email.com", "ana@email.com")).toBe(true);
    expect(isPasswordSameAsEmail("outra-senha", "ana@email.com")).toBe(false);
  });
});

describe("onboarding", () => {
  it("pede só telefone e foto, sem senha", () => {
    const result = onboardingSchema.safeParse({
      firstName: "Ana",
      lastName: "Silva",
      phone: "11999999999",
      avatarUrl: "https://example.com/ana.png",
    });
    expect(result.success).toBe(true);
    expect("password" in (result.data || {})).toBe(false);
  });

  it("marca senha definida só quando o metadata existe", () => {
    expect(hasPasswordSet({ user_metadata: { password_set: true } })).toBe(true);
    expect(hasPasswordSet({ user_metadata: {} })).toBe(false);
  });

  it("libera confirmar e onboarding para qualquer papel", () => {
    expect(canAccessPath("commercial", "/app/confirmar")).toBe(true);
    expect(canAccessPath("traffic", "/app/onboarding")).toBe(true);
  });
});
