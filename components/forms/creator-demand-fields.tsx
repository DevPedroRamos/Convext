"use client";

import { X } from "lucide-react";
import { Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DemandFileRecord } from "@/lib/demand-files";
import type { CreatorOption } from "@/lib/profile";
import type { CreateCreatorDemandValues } from "@/lib/validations/demand";

export function CreatorDemandFields({
  creators,
  register,
  control,
  errors,
  files,
  keptFiles,
  onFiles,
  onRemoveKept,
}: {
  creators: CreatorOption[];
  register: UseFormRegister<CreateCreatorDemandValues>;
  control: Control<CreateCreatorDemandValues>;
  errors: FieldErrors<CreateCreatorDemandValues>;
  files: File[];
  keptFiles: DemandFileRecord[];
  onFiles: (files: File[]) => void;
  onRemoveKept?: (id: string) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label>Nome</Label>
        <Input {...register("title")} placeholder="Campanha de lançamento" />
        {errors.title?.message ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label>Creator</Label>
        <Controller
          control={control}
          name="creatorId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar creator" /></SelectTrigger>
              <SelectContent>
                {creators.map((creator) => (
                  <SelectItem key={creator.id} value={creator.id}>{creator.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.creatorId?.message ? <p className="text-xs text-destructive">{errors.creatorId.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label>Observação</Label>
        <Textarea {...register("description")} rows={3} placeholder="Contexto interno para o designer" />
      </div>
      <div className="grid gap-2">
        <Label>Briefing</Label>
        <Textarea {...register("briefing")} rows={5} placeholder="O que precisa ser criado" />
        {errors.briefing?.message ? <p className="text-xs text-destructive">{errors.briefing.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label>Referência</Label>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          multiple
          onChange={(event) => onFiles([...files, ...Array.from(event.target.files || [])])}
        />
        {keptFiles.length || files.length ? (
          <ul className="grid gap-1 text-sm">
            {keptFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="truncate">{file.name}</span>
                {onRemoveKept ? (
                  <button type="button" onClick={() => onRemoveKept(file.id)} aria-label={`Remover ${file.name}`}>
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onFiles(files.filter((_, current) => current !== index))}
                  aria-label={`Remover ${file.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Button type="button" variant="ghost" size="sm" className="w-fit px-0" onClick={() => onFiles([])}>
          Limpar arquivos novos
        </Button>
      </div>
    </>
  );
}
