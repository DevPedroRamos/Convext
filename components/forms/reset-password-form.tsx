"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: ResetPasswordValues) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada.");
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="surface grid gap-5 p-6 sm:p-8">
      <div><p className="label text-primary">Nova senha</p><h1 className="mt-3 font-display text-5xl tracking-[-.08em]">Crie uma senha segura.</h1></div>
      <Field label="Senha" error={form.formState.errors.password?.message}><Input type="password" {...form.register("password")} /></Field>
      <Field label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}><Input type="password" {...form.register("confirmPassword")} /></Field>
      <Button disabled={loading} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">{loading ? <Loader2 className="animate-spin" /> : null} Salvar senha</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
