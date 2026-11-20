"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteConfirmSchema, type InviteConfirmValues } from "@/lib/validations/profile";

type InviteConfirmFormProps = {
  firstName: string;
  lastName: string;
  email: string;
  cargo: string;
};

export function InviteConfirmForm({ firstName, lastName, email, cargo }: InviteConfirmFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<InviteConfirmValues>({
    resolver: zodResolver(inviteConfirmSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || firstName;

  async function onSubmit(values: InviteConfirmValues) {
    setLoading(true);
    const response = await fetch("/api/confirmar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível criar sua senha.");
      return;
    }
    toast.success("Senha criada. Complete seu perfil.");
    router.push("/app/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="surface grid gap-6 p-6 sm:p-8">
      <div>
        <p className="label text-primary">Confirmar acesso</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-.08em] sm:text-5xl">Crie sua senha.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Confira seus dados e defina a senha para entrar na Convext.</p>
      </div>
      <div className="grid gap-5">
        <Field label="Nome"><Input value={name} readOnly /></Field>
        <Field label="E-mail"><Input value={email} readOnly /></Field>
        <Field label="Cargo"><Input value={cargo || "—"} readOnly /></Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>
      </div>
      <Button disabled={loading} className="h-11 w-fit bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="animate-spin" /> : null} Continuar
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
