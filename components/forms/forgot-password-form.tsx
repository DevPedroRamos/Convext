"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { emailSchema, type EmailValues } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });

  async function onSubmit(values: EmailValues) {
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${origin}/auth/callback?next=/redefinir-senha` });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Enviamos o link de recuperação para seu e-mail.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="surface grid gap-5 p-6 sm:p-8">
      <div><p className="label text-primary">Recuperação</p><h1 className="mt-3 font-display text-5xl tracking-[-.08em]">Redefina sua senha.</h1></div>
      <div className="grid gap-2"><Label>E-mail</Label><Input type="email" {...form.register("email")} />{form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}</div>
      <Button disabled={loading} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">{loading ? <Loader2 className="animate-spin" /> : null} Enviar link</Button>
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Voltar ao login</Link>
    </form>
  );
}
