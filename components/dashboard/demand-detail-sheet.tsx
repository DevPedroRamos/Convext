"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatePartsField } from "@/components/forms/date-parts-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { demandKindLabel, demandPriorityLabel, demandStatusLabel } from "@/lib/demand-labels";
import type { DemandRecord } from "@/lib/demands";
import { demandPriorities, demandStatuses, type DemandPriority, type DemandStatus } from "@/lib/validations/demand";

export function DemandDetailSheet({
  demand,
  onClose,
}: {
  demand: DemandRecord | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(demand)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-black/40"
        className="w-full overflow-y-auto sm:max-w-[50vw] data-[side=right]:sm:max-w-[50vw]"
      >
        {demand ? <DemandEditForm key={demand.id} demand={demand} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function DemandEditForm({ demand, onClose }: { demand: DemandRecord; onClose: () => void }) {
  const router = useRouter();
  const [description, setDescription] = useState(demand.description);
  const [status, setStatus] = useState<DemandStatus>(demand.status);
  const [priority, setPriority] = useState<DemandPriority>(demand.priority);
  const [dueOn, setDueOn] = useState(demand.dueOn || "");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="grid gap-6 py-6">
      <SheetHeader>
        <SheetTitle>{demand.clientName}</SheetTitle>
        <SheetDescription>
          {demand.clientCompany} · {demandKindLabel(demand.kind)}
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-2 text-sm">
        <p className="text-muted-foreground">
          Responsável: <span className="text-foreground">{demand.responsibleName || "Sem responsável"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{demandKindLabel(demand.kind)}</Badge>
          <Badge variant="outline">{demandStatusLabel(demand.status)}</Badge>
        </div>
      </div>
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
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={8} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
        <Button disabled={saving} onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Salvar
        </Button>
      </div>
    </div>
  );
}
