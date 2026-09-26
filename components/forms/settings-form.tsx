"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { passwordChangeSchema, type PasswordChangeValues } from "@/lib/validations/profile";

export function SettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<PasswordChangeValues>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: PasswordChangeValues) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    form.reset();
    toast.success("Senha alterada.");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={form.handleSubmit(onSubmit)} className="surface grid gap-5 p-6">
        <div><p className="label text-primary">Segurança</p><h2 className="mt-2 text-2xl tracking-[-.05em]">Alterar senha</h2></div>
        <Field label="Nova senha" error={form.formState.errors.password?.message}><Input type="password" {...form.register("password")} /></Field>
        <Field label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}><Input type="password" {...form.register("confirmPassword")} /></Field>
        <Button disabled={loading} className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">{loading ? <Loader2 className="animate-spin" /> : null} Alterar senha</Button>
      </form>
      <div className="surface p-6">
        <p className="label text-primary">Sessão</p><h2 className="mt-2 text-2xl tracking-[-.05em]">Acesso atual</h2><p className="mt-4 text-sm text-muted-foreground">Encerre sua sessão neste dispositivo quando terminar de usar a área Convext.</p>
        <Button variant="outline" onClick={signOut} className="mt-8"><LogOut /> Sair</Button>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
