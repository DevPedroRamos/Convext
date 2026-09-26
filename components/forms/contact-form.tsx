"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactFormValues } from "@/lib/validations/contact";

const inquiryTypes = ["Novo projeto", "Orçamento", "Parcerias", "Outro"] as const;

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { inquiryType: "Novo projeto", firstName: "", lastName: "", email: "", phone: "", company: "", website: "", message: "" },
  });
  const inquiryType = useWatch({ control: form.control, name: "inquiryType" });

  async function onSubmit(values: ContactFormValues) {
    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar sua mensagem.");
      form.reset();
      toast.success(payload.emailSent ? "Mensagem enviada." : "Contato salvo. Configure o Resend para enviar e-mail.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="surface grid gap-5 p-5 sm:p-8">
      <div className="flex items-center gap-2"><span className="size-2 bg-primary" /><h2 className="text-2xl tracking-[-.04em]">Envie uma nota.</h2></div>
      <div className="grid gap-2">
        <Label>Tipo de contato</Label>
        <Select value={inquiryType} onValueChange={(value) => form.setValue("inquiryType", value as ContactFormValues["inquiryType"], { shouldValidate: true })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{inquiryTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" error={form.formState.errors.firstName?.message}><Input {...form.register("firstName")} /></Field>
        <Field label="Sobrenome" error={form.formState.errors.lastName?.message}><Input {...form.register("lastName")} /></Field>
      </div>
      <Field label="E-mail" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></Field>
        <Field label="Empresa" error={form.formState.errors.company?.message}><Input {...form.register("company")} /></Field>
      </div>
      <Field label="Website / Instagram" error={form.formState.errors.website?.message}><Input {...form.register("website")} /></Field>
      <Field label="Mensagem" error={form.formState.errors.message?.message}><Textarea rows={6} {...form.register("message")} /></Field>
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="label hidden text-muted-foreground sm:block">Lemos todas as mensagens</p>
        <Button type="submit" disabled={loading} className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="animate-spin" /> : null} Enviar <ArrowUpRight />
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
