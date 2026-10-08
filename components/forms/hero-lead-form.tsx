"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { heroLeadSchema, type HeroLeadValues } from "@/lib/validations/hero-lead";

export function HeroLeadForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm<HeroLeadValues>({
    resolver: zodResolver(heroLeadSchema),
    defaultValues: { name: "", email: "", whatsapp: "", company: "" },
  });

  async function onSubmit(values: HeroLeadValues) {
    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar seu contato.");
      form.reset();
      toast.success(payload.emailSent ? "Mensagem enviada." : "Contato salvo. Configure o Resend para enviar e-mail.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-3xl border border-white/10 bg-card p-6 shadow-[0_24px_80px_rgba(0,0,0,.45)] sm:p-8"
    >
      <h2 className="text-2xl tracking-[-.04em] text-foreground sm:text-[1.7rem]">
        Fale com a Convext sobre seu próximo lançamento
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Conte sobre seu empreendimento. Um especialista retorna em até 1 dia útil.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Field htmlFor="hero-name" label="Nome" required error={form.formState.errors.name?.message}>
          <Input
            id="hero-name"
            autoComplete="name"
            className="h-12 rounded-xl border-white/10 bg-white/5 px-4"
            {...form.register("name")}
          />
        </Field>
        <Field htmlFor="hero-email" label="E-mail" required error={form.formState.errors.email?.message}>
          <Input
            id="hero-email"
            type="email"
            autoComplete="email"
            className="h-12 rounded-xl border-white/10 bg-white/5 px-4"
            {...form.register("email")}
          />
        </Field>
        <Field htmlFor="hero-whatsapp" label="WhatsApp" required error={form.formState.errors.whatsapp?.message}>
          <Input
            id="hero-whatsapp"
            type="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            className="h-12 rounded-xl border-white/10 bg-white/5 px-4"
            {...form.register("whatsapp")}
          />
        </Field>
        <Field htmlFor="hero-company" label="Empresa" error={form.formState.errors.company?.message}>
          <Input
            id="hero-company"
            autoComplete="organization"
            className="h-12 rounded-xl border-white/10 bg-white/5 px-4"
            {...form.register("company")}
          />
        </Field>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="mt-6 h-12 w-full rounded-full bg-primary text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground hover:bg-primary/90"
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        Quero gerar mais leads qualificados
      </Button>
    </form>
  );
}

function Field({
  htmlFor,
  label,
  required,
  error,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
