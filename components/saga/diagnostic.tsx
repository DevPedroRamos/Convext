"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SectionHeading } from "@/components/saga/sections";
import { diagnostic } from "@/lib/saga-content";
import { diagnosticSchema, type DiagnosticValues } from "@/lib/validations/diagnostic";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-foreground outline-none transition-colors duration-200 placeholder:text-foreground/30 hover:border-white/20 focus:border-primary/70 aria-invalid:border-destructive/70";

export function Diagnostic() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useForm<DiagnosticValues>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: { source: "diagnostico", name: "", whatsapp: "", email: "", company: "", challenge: "", budget: "" },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: DiagnosticValues) {
    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar sua solicitação.");
      form.reset();
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="diagnostico" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-0 h-[42rem] w-[42rem] bg-[radial-gradient(circle,rgba(243,87,3,.14),transparent_62%)]" />
      <div className="container-convext relative grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:pt-4">
          <SectionHeading index="10" eyebrow={diagnostic.eyebrow}>
            {diagnostic.title[0]}
            <br />
            {diagnostic.title[1]} <em>{diagnostic.accent}</em>
          </SectionHeading>
          <p className="mt-8 max-w-[44ch] text-base leading-7 text-foreground/60">{diagnostic.body}</p>
          <ul className="mt-9 space-y-4">
            {diagnostic.checks.map((check) => (
              <li key={check} className="flex items-center gap-3 text-[15px] text-foreground/80">
                <span className="grid size-6 place-items-center rounded-full border border-primary/40 text-primary">
                  <Check className="size-3.5" />
                </span>
                {check}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-10">
          {sent ? (
            <div role="status" className="flex min-h-[28rem] flex-col justify-center">
              <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-5" />
              </span>
              <h3 className="saga-title mt-8 text-4xl">
                Solicitação <em>recebida.</em>
              </h3>
              <p className="mt-4 max-w-[40ch] text-foreground/60">
                Um especialista da Saga retorna em até 1 dia útil, pelo WhatsApp ou e-mail informados.
              </p>
              <button type="button" onClick={() => setSent(false)} className="mt-8 w-fit text-sm text-foreground/50 underline-offset-4 hover:text-foreground hover:underline">
                Enviar outra solicitação
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <h3 className="font-display text-2xl tracking-[-0.04em]">Solicitar diagnóstico estratégico</h3>
              <p className="mt-2 text-sm text-foreground/50">Leva menos de um minuto. Retorno em até 1 dia útil.</p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field id="dg-name" label="Nome completo" error={errors.name?.message}>
                  <input id="dg-name" autoComplete="name" aria-invalid={!!errors.name} className={fieldClass} {...form.register("name")} />
                </Field>
                <Field id="dg-whatsapp" label="WhatsApp com DDD" error={errors.whatsapp?.message}>
                  <input id="dg-whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" aria-invalid={!!errors.whatsapp} className={fieldClass} {...form.register("whatsapp")} />
                </Field>
                <Field id="dg-email" label="E-mail profissional" error={errors.email?.message}>
                  <input id="dg-email" type="email" autoComplete="email" aria-invalid={!!errors.email} className={fieldClass} {...form.register("email")} />
                </Field>
                <Field id="dg-company" label="Empresa" error={errors.company?.message}>
                  <input id="dg-company" autoComplete="organization" aria-invalid={!!errors.company} className={fieldClass} {...form.register("company")} />
                </Field>
                <Field id="dg-challenge" label="Qual desafio é prioridade?" error={errors.challenge?.message} className="sm:col-span-2">
                  <div className="relative"><select id="dg-challenge" aria-invalid={!!errors.challenge} className={cn(fieldClass, "appearance-none pr-10")} {...form.register("challenge")}>
                    <option value="" disabled>Selecione</option>
                    {diagnostic.challenges.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" /></div>
                </Field>
                <Field id="dg-budget" label="Investimento mensal em marketing" optional className="sm:col-span-2">
                  <div className="relative"><select id="dg-budget" className={cn(fieldClass, "appearance-none pr-10")} {...form.register("budget")}>
                    <option value="">Prefiro informar na conversa</option>
                    {diagnostic.budgets.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" /></div>
                </Field>
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-5 text-foreground/55">
                <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#f35703]" {...form.register("consent")} />
                <span>Autorizo a Saga a entrar em contato pelos canais informados para tratar desta solicitação. Meus dados não serão usados para outros fins.</span>
              </label>
              {errors.consent ? <p className="mt-2 text-xs text-destructive">{errors.consent.message}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="saga-press mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm text-primary-foreground hover:bg-[#ff6512] disabled:opacity-70"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {loading ? "Enviando…" : "Enviar solicitação"}
                {loading ? null : <ArrowUpRight className="arrow-nudge size-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  optional,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-xs text-foreground/60">
        {label} {optional ? <span className="text-foreground/30">(opcional)</span> : <span className="text-primary">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
