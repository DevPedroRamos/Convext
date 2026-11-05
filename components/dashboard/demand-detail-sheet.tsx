"use client";

import { Download, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatePartsField } from "@/components/forms/date-parts-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { canRequestCreative, canUploadCreatives } from "@/lib/demand-access";
import type { DemandFileRecord } from "@/lib/demand-files";
import { demandKindLabel, demandPriorityLabel, demandStatusLabel } from "@/lib/demand-labels";
import type { DemandRecord } from "@/lib/demands";
import { uploadDemandFiles } from "@/lib/upload-demand-file";
import { demandPriorities, demandStatuses, type DemandPriority, type DemandStatus } from "@/lib/validations/demand";

export function DemandDetailSheet({
  demand,
  currentUserId,
  isAdmin,
  isOperations,
  onClose,
  onRequestCreative,
  onReuseBriefing,
}: {
  demand: DemandRecord | null;
  currentUserId?: string | null;
  isAdmin: boolean;
  isOperations: boolean;
  onClose: () => void;
  onRequestCreative: (demand: DemandRecord) => void;
  onReuseBriefing: (demand: DemandRecord, files: DemandFileRecord[]) => void;
}) {
  return (
    <Sheet open={Boolean(demand)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-black/40"
        className="w-full overflow-y-auto sm:max-w-[50vw] data-[side=right]:sm:max-w-[50vw]"
      >
        {demand ? (
          <DemandEditForm
            key={demand.id}
            demand={demand}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isOperations={isOperations}
            onClose={onClose}
            onRequestCreative={onRequestCreative}
            onReuseBriefing={onReuseBriefing}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DemandEditForm({
  demand,
  currentUserId,
  isAdmin,
  isOperations,
  onClose,
  onRequestCreative,
  onReuseBriefing,
}: {
  demand: DemandRecord;
  currentUserId?: string | null;
  isAdmin: boolean;
  isOperations: boolean;
  onClose: () => void;
  onRequestCreative: (demand: DemandRecord) => void;
  onReuseBriefing: (demand: DemandRecord, files: DemandFileRecord[]) => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(demand.description);
  const [status, setStatus] = useState<DemandStatus>(demand.status);
  const [priority, setPriority] = useState<DemandPriority>(demand.priority);
  const [dueOn, setDueOn] = useState(demand.dueOn || "");
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<DemandFileRecord[]>([]);
  const [variationOpen, setVariationOpen] = useState(false);
  const [variationNote, setVariationNote] = useState("");
  const [variationSaving, setVariationSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/demandas/${demand.id}/files`)
      .then((response) => response.json())
      .then((payload) => {
        if (active && Array.isArray(payload.files)) setFiles(payload.files);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [demand.id]);

  async function save() {
    setSaving(true);
    const response = await fetch(`/api/demandas/${demand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, status, priority, dueOn }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar.");
      return;
    }
    toast.success("Demanda atualizada.");
    router.refresh();
    onClose();
  }

  async function submitVariation() {
    setVariationSaving(true);
    const response = await fetch(`/api/demandas/${demand.id}/variacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: variationNote }),
    });
    const payload = await response.json().catch(() => ({}));
    setVariationSaving(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível solicitar a variação.");
      return;
    }
    toast.success("Variação solicitada.");
    setVariationOpen(false);
    router.refresh();
    onClose();
  }

  const references = files.filter((file) => file.kind === "reference");
  const creatives = files.filter((file) => file.kind === "creative");
  const showRequest = canRequestCreative(demand, currentUserId, isOperations);
  const showUpload = canUploadCreatives(demand, currentUserId);

  return (
    <div className="grid gap-6 py-6">
      <SheetHeader>
        <SheetTitle>{demand.title || demand.clientName}</SheetTitle>
        <SheetDescription>
          {demand.clientCompany || demand.clientName} · {demandKindLabel(demand.kind)}
          {demand.typeName ? ` · ${demand.typeName}` : ""}
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-2 text-sm">
        <p className="text-muted-foreground">
          Responsável: <span className="text-foreground">{demand.responsibleName || "Sem responsável"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{demandKindLabel(demand.kind)}</Badge>
          <Badge variant="outline">{demandStatusLabel(demand.status)}</Badge>
          {demand.typeName ? <Badge variant="outline">{demand.typeName}</Badge> : null}
        </div>
        {demand.solution ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Solução</p>
            <p>{demand.solution}</p>
          </div>
        ) : null}
        {demand.variationNote ? (
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
            <p className="text-xs text-primary">Variação pedida</p>
            <p>{demand.variationNote}</p>
          </div>
        ) : null}
      </div>
      {demand.kind === "creator" && demand.briefing ? (
        <div className="grid gap-2">
          <Label>Briefing</Label>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{demand.briefing}</p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as DemandStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {demandStatuses.map((item) => (
                <SelectItem key={item} value={item}>{demandStatusLabel(item)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as DemandPriority)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {demandPriorities.map((item) => (
                <SelectItem key={item} value={item}>{demandPriorityLabel(item)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Prazo</Label>
        <DatePartsField value={dueOn} onChange={setDueOn} />
      </div>
      <div className="grid gap-2">
        <Label>{demand.kind === "creator" ? "Observação" : "Descrição"}</Label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={8} />
      </div>
      <DemandFilesList title="Referências" files={references} />
      <DemandFilesList title="Criativos" files={creatives} />
      {showUpload ? (
        <CreativeUpload demandId={demand.id} onFilesChange={setFiles} />
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        {showRequest ? (
          <Button type="button" variant="outline" onClick={() => onRequestCreative(demand)}>
            Solicitar criativo
          </Button>
        ) : null}
        {isAdmin && demand.kind === "creator" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onReuseBriefing(demand, references)}>
              Reaproveitar briefing
            </Button>
            <Button type="button" variant="outline" onClick={() => setVariationOpen(true)}>
              Variação
            </Button>
          </>
        ) : null}
        <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
        <Button disabled={saving} onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Salvar
        </Button>
      </div>

      <Dialog open={variationOpen} onOpenChange={setVariationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar variação</DialogTitle>
            <DialogDescription>Pede mais versões do criativo nesta mesma demanda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>O que variar</Label>
              <Textarea value={variationNote} onChange={(event) => setVariationNote(event.target.value)} rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setVariationOpen(false)}>Cancelar</Button>
              <Button disabled={variationSaving || variationNote.trim().length < 2} onClick={submitVariation}>
                Solicitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DemandFilesList({ title, files }: { title: string; files: DemandFileRecord[] }) {
  if (files.length === 0) return null;

  async function download(file: DemandFileRecord) {
    const response = await fetch(`/api/demandas/${file.demandId}/files/${file.id}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      toast.error(payload.error || "Não foi possível baixar o arquivo.");
      return;
    }
    window.open(payload.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-2">
      <Label>{title}</Label>
      <ul className="grid gap-2">
        {files.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <span className="truncate">{file.name}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => download(file)}>
              <Download /> Baixar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreativeUpload({
  demandId,
  onFilesChange,
}: {
  demandId: string;
  onFilesChange: (files: DemandFileRecord[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onPick(list?: FileList | null) {
    const files = Array.from(list || []);
    if (!files.length) return;
    setUploading(true);
    const result = await uploadDemandFiles(demandId, files, "creative");
    setUploading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(files.length > 1 ? "Criativos enviados." : "Criativo enviado.");
    const response = await fetch(`/api/demandas/${demandId}/files`);
    const payload = await response.json().catch(() => ({}));
    if (Array.isArray(payload.files)) onFilesChange(payload.files);
  }

  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
      <Label>Subir criativo</Label>
      <p className="text-xs text-muted-foreground">Envie um ou mais arquivos da peça finalizada.</p>
      <label className="inline-flex items-center gap-2">
        <Upload className="size-4" />
        <span className="text-sm">{uploading ? "Enviando..." : "Escolher arquivos"}</span>
        <input
          type="file"
          className="text-sm"
          multiple
          disabled={uploading}
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,application/pdf"
          onChange={(event) => onPick(event.target.files)}
        />
      </label>
    </div>
  );
}
