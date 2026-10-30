"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/profile";

type OnboardingFormProps = { userId: string; email: string; cargo?: string | null; defaultValues: Pick<OnboardingValues, "firstName" | "lastName" | "phone" | "avatarUrl"> };

export function OnboardingForm({ userId, email, cargo, defaultValues }: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...defaultValues, password: "", confirmPassword: "" },
  });
  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });

  async function uploadAvatar(file?: File) {
    if (!file) return;
    setAvatarLoading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setAvatarLoading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    form.setValue("avatarUrl", data.publicUrl, { shouldDirty: true, shouldValidate: true });
    setAvatarLoading(false);
  }

  async function onSubmit(values: OnboardingValues) {
    setLoading(true);
    const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) { toast.error(payload.error || "Não foi possível concluir o acesso."); return; }
    toast.success("Acesso configurado.");
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="surface grid gap-6 p-6 sm:p-8">
      <div>
        <p className="label text-primary">Primeiro acesso</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-.08em] sm:text-5xl">Complete seu perfil.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Troque a senha temporária, envie sua foto e confirme seus dados para entrar na área Convext.</p>
      </div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar className="size-20"><AvatarImage src={avatarUrl || undefined} /><AvatarFallback>{defaultValues.firstName?.slice(0, 2).toUpperCase() || "CV"}</AvatarFallback></Avatar>
        <div className="flex-1">
          <p className="text-lg">Foto de perfil</p>
          <p className="text-sm text-muted-foreground">Obrigatória no primeiro acesso.</p>
          {form.formState.errors.avatarUrl?.message ? <p className="mt-1 text-xs text-destructive">{form.formState.errors.avatarUrl.message}</p> : null}
        </div>
        <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm hover:bg-secondary/80">
          {avatarLoading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Enviar foto
          <Input type="file" className="hidden" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
        </Label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome" error={form.formState.errors.firstName?.message}><Input {...form.register("firstName")} /></Field>
        <Field label="Sobrenome" error={form.formState.errors.lastName?.message}><Input {...form.register("lastName")} /></Field>
        <Field label="E-mail"><Input value={email} readOnly /></Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} placeholder="(11) 99999-9999" /></Field>
        <Field label="Cargo"><Input value={cargo || "—"} readOnly /></Field>
        <Field label="Nova senha" error={form.formState.errors.password?.message}><Input type="password" autoComplete="new-password" {...form.register("password")} /></Field>
        <Field label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}><Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} /></Field>
      </div>
      <Button disabled={loading || avatarLoading} className="h-11 w-fit bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="animate-spin" /> : null} Entrar na Convext
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
