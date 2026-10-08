"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CaseRecord } from "@/lib/case-model";
import { createClient } from "@/lib/supabase/browser";
import { caseSchema, type CaseValues } from "@/lib/validations/case";

type CaseFormProps = { userId: string; record?: CaseRecord };

const IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml,.svg,.jpg,.jpeg,.png,.webp,.gif";
const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function imageContentType(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return IMAGE_MIME_BY_EXT[ext] || (file.type.startsWith("image/") ? file.type : "");
}

function emptyValues(): CaseValues {
  return {
    name: "",
    segment: "",
    summary: "",
    logoUrl: "",
    coverUrl: "",
    concept: "",
    location: "",
    fronts: [],
    videoUrl: "",
    identities: [],
    published: true,
    sortOrder: 0,
  };
}

function fromRecord(record: CaseRecord): CaseValues {
  return {
    name: record.name,
    segment: record.segment,
    summary: record.summary,
    logoUrl: record.logoUrl,
    coverUrl: record.coverUrl || "",
    concept: record.concept || "",
    location: record.location || "",
    fronts: record.fronts,
    videoUrl: record.videoUrl || "",
    identities: record.identities,
    published: record.published,
    sortOrder: record.sortOrder,
  };
}

type FormValues = Omit<CaseValues, "fronts" | "identities"> & {
  frontsText: string;
  identityOneUrl: string;
  identityOneCaption: string;
  identityTwoUrl: string;
  identityTwoCaption: string;
};

export function CaseForm({ userId, record }: CaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const defaults = record ? fromRecord(record) : emptyValues();
  const { fronts, identities, ...fields } = defaults;
  const form = useForm<FormValues>({
    defaultValues: {
      ...fields,
      frontsText: fronts.join(", "),
      identityOneUrl: identities[0]?.url || "",
      identityOneCaption: identities[0]?.caption || "",
      identityTwoUrl: identities[1]?.url || "",
      identityTwoCaption: identities[1]?.caption || "",
    },
  });
  const logoUrl = useWatch({ control: form.control, name: "logoUrl" });
  const coverUrl = useWatch({ control: form.control, name: "coverUrl" });
  const identityOneUrl = useWatch({ control: form.control, name: "identityOneUrl" });
  const identityTwoUrl = useWatch({ control: form.control, name: "identityTwoUrl" });

  async function upload(field: keyof FormValues, file?: File) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const contentType = imageContentType(file);
    if (!contentType) {
      toast.error("Envie uma imagem JPG, PNG, WEBP, GIF ou SVG.");
      return;
    }
    setUploading(field);
    const supabase = createClient();
    const path = `${userId}/${field}-${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
    const { error } = await supabase.storage.from("cases").upload(path, file, { upsert: true, contentType });
    if (error) {
      toast.error(error.message);
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from("cases").getPublicUrl(path);
    form.setValue(field, data.publicUrl, { shouldDirty: true, shouldValidate: true });
    form.clearErrors(field);
    setUploading(null);
  }

  async function onSubmit(values: FormValues) {
    const identities = [
      { url: values.identityOneUrl, caption: values.identityOneCaption },
      { url: values.identityTwoUrl, caption: values.identityTwoCaption },
    ].filter((item) => item.url);
    const parsed = caseSchema.safeParse({
      name: values.name,
      segment: values.segment,
      summary: values.summary,
      logoUrl: values.logoUrl,
      coverUrl: values.coverUrl,
      concept: values.concept,
      location: values.location,
      fronts: values.frontsText.split(",").map((item) => item.trim()).filter(Boolean),
      videoUrl: values.videoUrl,
      identities,
      published: values.published,
      sortOrder: values.sortOrder,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.logoUrl?.[0]) form.setError("logoUrl", { message: fieldErrors.logoUrl[0] });
      const first = Object.values(fieldErrors).flat()[0];
      toast.error(first || "Dados inválidos.");
      return;
    }
    setLoading(true);
    const response = await fetch(record ? `/api/cases/${record.id}` : "/api/cases", {
      method: record ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar.");
      return;
    }
    toast.success(record ? "Case atualizado." : "Case publicado.");
    router.push("/app/cases");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="surface grid gap-5 p-6 md:grid-cols-2">
        <Field label="Nome do cliente" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Vista Lago Residence" />
        </Field>
        <Field label="Segmento" error={form.formState.errors.segment?.message}>
          <Input {...form.register("segment")} placeholder="Condomínio residencial" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Resumo" error={form.formState.errors.summary?.message}>
            <Textarea rows={3} {...form.register("summary")} placeholder="Uma linha sobre o trabalho e o resultado." />
          </Field>
        </div>
        <Field label="Localização">
          <Input {...form.register("location")} placeholder="Icaraí, CE" />
        </Field>
        <Field label="Frentes aplicadas">
          <Input {...form.register("frontsText")} placeholder="Branding, Website, Performance" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Conceito">
            <Textarea rows={5} {...form.register("concept")} placeholder="Texto da página individual. Se vazio, o resumo entra no lugar." />
          </Field>
        </div>
        <Field label="Vídeo (YouTube ou Vimeo)">
          <Input {...form.register("videoUrl")} placeholder="https://www.youtube.com/watch?v=..." />
        </Field>
        <Field label="Ordem">
          <Input type="number" min={0} {...form.register("sortOrder")} />
        </Field>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input type="checkbox" className="size-4 accent-primary" {...form.register("published")} />
          Publicar no site
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <UploadCard
          title="Logo"
          hint="Marca do cliente no card e na página."
          preview={logoUrl}
          error={form.formState.errors.logoUrl?.message}
          loading={uploading === "logoUrl"}
          onFile={(file) => upload("logoUrl", file)}
        />
        <UploadCard
          title="Imagem de capa"
          hint="Fotografia do card. Sem ela, o card usa o logo no fundo."
          preview={coverUrl}
          loading={uploading === "coverUrl"}
          onFile={(file) => upload("coverUrl", file)}
        />
        <UploadCard
          title="Identidade 01"
          hint="Peça da marca na página individual."
          preview={identityOneUrl}
          loading={uploading === "identityOneUrl"}
          onFile={(file) => upload("identityOneUrl", file)}
        >
          <Input {...form.register("identityOneCaption")} placeholder="Legenda" />
        </UploadCard>
        <UploadCard
          title="Identidade 02"
          hint="Segunda peça da marca."
          preview={identityTwoUrl}
          loading={uploading === "identityTwoUrl"}
          onFile={(file) => upload("identityTwoUrl", file)}
        >
          <Input {...form.register("identityTwoCaption")} placeholder="Legenda" />
        </UploadCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading || Boolean(uploading)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="animate-spin" /> : null}
          {record ? "Salvar case" : "Cadastrar case"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/app/cases")}>Cancelar</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function UploadCard({
  title,
  hint,
  preview,
  error,
  loading,
  onFile,
  children,
}: {
  title: string;
  hint: string;
  preview?: string;
  error?: string;
  loading: boolean;
  onFile: (file?: File) => void;
  children?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick() {
    inputRef.current?.click();
  }

  function handleFile(file?: File) {
    if (inputRef.current) inputRef.current.value = "";
    onFile(file);
  }

  return (
    <div className="surface grid gap-4 p-6">
      <button
        type="button"
        onClick={pick}
        disabled={loading}
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary text-left"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">Sem imagem</div>
        )}
      </button>
      <div>
        <p className="text-lg">{title}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      {children}
      <Button type="button" variant="secondary" disabled={loading} onClick={pick} className="w-fit">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Enviar
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
