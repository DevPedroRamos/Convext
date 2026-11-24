"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { GALLERY_BUCKET, GALLERY_MAX, galleryContentType, parseGallery } from "@/lib/spaces/gallery";
import { createClient } from "@/lib/supabase/browser";

export function GalleryField({
  label,
  fieldKey,
  value,
  onChange,
  disabled,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const urls = parseGallery(value);

  async function addFiles(files: FileList | null) {
    if (disabled || !files?.length) return;
    const remaining = GALLERY_MAX - urls.length;
    if (remaining <= 0) {
      toast.error(`No máximo ${GALLERY_MAX} imagens.`);
      return;
    }
    const chosen = Array.from(files).slice(0, remaining);
    setUploading(true);
    const supabase = createClient();
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) {
      setUploading(false);
      toast.error("Faça login para enviar imagens.");
      return;
    }
    const next = [...urls];
    for (const [index, file] of chosen.entries()) {
      const contentType = galleryContentType(file);
      if (!contentType) {
        toast.error(`${file.name}: envie JPG, PNG, WEBP ou GIF.`);
        continue;
      }
      const ext = (file.name.split(".").pop()?.toLowerCase() || "jpg").replace("jpeg", "jpg");
      const path = `${userId}/${fieldKey}-${Date.now()}-${index}.${ext}`;
      const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, file, { upsert: true, contentType });
      if (error) {
        toast.error(error.message);
        continue;
      }
      next.push(supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setUploading(false);
    onChange(JSON.stringify(next));
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(url: string) {
    onChange(JSON.stringify(urls.filter((item) => item !== url)));
  }

  return (
    <Field label={label}>
      <div className="grid gap-3">
        {urls.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {urls.map((url) => (
              <li key={url} className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                {disabled ? null : (
                  <button type="button" className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-destructive" onClick={() => remove(url)} aria-label="Remover imagem">
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : null}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            disabled={disabled || uploading || urls.length >= GALLERY_MAX}
            onChange={(event) => addFiles(event.target.files)}
          />
          <Button type="button" variant="outline" size="sm" disabled={disabled || uploading || urls.length >= GALLERY_MAX} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {urls.length ? "Adicionar imagens" : "Selecionar imagens"}
          </Button>
        </div>
      </div>
    </Field>
  );
}

export function GalleryThumbs({ urls }: { urls: string[] }) {
  if (!urls.length) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {urls.map((url) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
          </a>
        </li>
      ))}
    </ul>
  );
}
