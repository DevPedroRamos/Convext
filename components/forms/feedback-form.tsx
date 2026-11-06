"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ClientSuggest } from "@/components/forms/client-suggest";
import { CreatorDemandFields } from "@/components/forms/creator-demand-fields";
import { DatePartsField } from "@/components/forms/date-parts-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRecord } from "@/lib/clients";
import { demandPriorityLabel } from "@/lib/demand-labels";
import type { FeedbackType } from "@/lib/feedback-types";
import type { CreatorOption } from "@/lib/profile";
import { uploadDemandFiles } from "@/lib/upload-demand-file";
import {
  createCreatorDemandSchema,
  createFeedbackSchema,
  demandPriorities,
  type CreateCreatorDemandValues,
  type CreateFeedbackValues,
} from "@/lib/validations/demand";

type FeedbackFormProps = {
  clients: ClientRecord[];
  types: FeedbackType[];
  creators: CreatorOption[];
  onSuccess: () => void;
  onCancel: () => void;
};

export function FeedbackForm({ clients, types, creators, onSuccess, onCancel }: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [typeId, setTypeId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<CreateFeedbackValues>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: { clientId: "", typeId: "", description: "", priority: "medium", dueOn: "" },
  });
  const creatorForm = useForm<CreateCreatorDemandValues>({
    resolver: zodResolver(createCreatorDemandSchema),
    defaultValues: { clientId: "", title: "", creatorId: "", briefing: "", description: "", referenceFileIds: [] },
  });
  const selectedType = types.find((type) => type.id === typeId) || null;

  async function onSubmit(values: CreateFeedbackValues) {
    let creator: CreateCreatorDemandValues | undefined;
    if (selectedType?.spawnsCreator) {
      const valid = await creatorForm.trigger(["title", "creatorId", "briefing"]);
      if (!valid || !selected) return;
      creator = { ...creatorForm.getValues(), clientId: selected.id };
    }

    setLoading(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: values.clientId,
        typeId: values.typeId,
        description: values.description,
        priority: values.priority,
        dueOn: values.dueOn,
        creator,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setLoading(false);
      toast.error(payload.error || "Não foi possível cadastrar.");
      if (payload.feedback?.id) onSuccess();
      return;
    }
    if (payload.creatorDemand?.id && files.length) {
      const uploaded = await uploadDemandFiles(payload.creatorDemand.id, files, "reference");
      if (uploaded.error) {
        setLoading(false);
        toast.warning(`Feedback cadastrado, mas as referências não foram anexadas. ${uploaded.error}`);
        onSuccess();
        return;
      }
    }
    setLoading(false);
    toast.success("Feedback cadastrado.");
    onSuccess();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Cliente</Label>
        <ClientSuggest
          clients={clients}
          value={selected}
          onChange={(client) => {
            setSelected(client);
            form.setValue("clientId", client?.id || "", { shouldValidate: true });
            creatorForm.setValue("clientId", client?.id || "", { shouldValidate: true });
          }}
        />
        {form.formState.errors.clientId?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.clientId.message}</p>
        ) : null}
      </div>
      {selected ? (
        <p className="text-sm text-muted-foreground">
          Responsável: <span className="text-foreground">{selected.responsibleName || "Sem responsável"}</span>
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label>Tipo</Label>
        <Controller
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => {
              field.onChange(value);
              setTypeId(value);
            }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.typeId?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.typeId.message}</p>
        ) : null}
      </div>
      {selectedType ? (
        <div className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <Label>Solução</Label>
          <p className="text-sm text-muted-foreground">{selectedType.solution || "Sem solução cadastrada"}</p>
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label>Prioridade</Label>
        <Controller
          control={form.control}
          name="priority"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {demandPriorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>{demandPriorityLabel(priority)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="grid gap-2">
        <Label>Prazo</Label>
        <Controller
          control={form.control}
          name="dueOn"
          render={({ field }) => (
            <DatePartsField value={field.value} onChange={field.onChange} />
          )}
        />
        {form.formState.errors.dueOn?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.dueOn.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label>Descrição</Label>
        <Textarea {...form.register("description")} rows={4} placeholder="O que o cliente pediu ou relatou" />
        {form.formState.errors.description?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        ) : null}
      </div>
      {selectedType?.spawnsCreator ? (
        <div className="grid gap-4 rounded-lg border border-border p-3">
          <p className="text-sm font-medium">Demanda para o designer</p>
          <CreatorDemandFields
            creators={creators}
            register={creatorForm.register}
            control={creatorForm.control}
            errors={creatorForm.formState.errors}
            files={files}
            keptFiles={[]}
            onFiles={setFiles}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="animate-spin" /> : null}
          Cadastrar
        </Button>
      </div>
    </form>
  );
}
