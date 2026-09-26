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
import { profileSchema, type ProfileValues } from "@/lib/validations/profile";

type ProfileFormProps = { userId: string; email: string; defaultValues: ProfileValues };

export function ProfileForm({ userId, email, defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues });
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

  async function onSubmit(values: ProfileValues) {
    setLoading(true);
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) { toast.error(payload.error || "Não foi possível salvar."); return; }
    toast.success("Perfil atualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar className="size-20"><AvatarImage src={avatarUrl || undefined} /><AvatarFallback>{defaultValues.firstName?.slice(0, 2).toUpperCase() || "CV"}</AvatarFallback></Avatar>
        <div className="flex-1"><p className="text-lg">Avatar</p><p className="text-sm text-muted-foreground">Use Supabase Storage para manter sua imagem de perfil.</p></div>
        <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm hover:bg-secondary/80">
          {avatarLoading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Enviar avatar
          <Input type="file" className="hidden" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
        </Label>
      </div>
      <div className="surface grid gap-5 p-6 md:grid-cols-2">
        <Field label="Nome" error={form.formState.errors.firstName?.message}><Input {...form.register("firstName")} /></Field>
        <Field label="Sobrenome" error={form.formState.errors.lastName?.message}><Input {...form.register("lastName")} /></Field>
        <Field label="E-mail"><Input value={email} readOnly /></Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></Field>
        <Field label="Cargo" error={form.formState.errors.role?.message}><Input {...form.register("role")} /></Field>
        <Field label="Empresa" error={form.formState.errors.company?.message}><Input {...form.register("company")} /></Field>
      </div>
      <Button disabled={loading} className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">{loading ? <Loader2 className="animate-spin" /> : null} Salvar alterações</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
