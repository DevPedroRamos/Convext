"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ClientSuggest } from "@/components/forms/client-suggest";
import { CreatorDemandFields } from "@/components/forms/creator-demand-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ClientRecord } from "@/lib/clients";
import type { DemandFileRecord } from "@/lib/demand-files";
import type { CreatorOption } from "@/lib/profile";
import { uploadDemandFiles } from "@/lib/upload-demand-file";
import { createCreatorDemandSchema, type CreateCreatorDemandValues } from "@/lib/validations/demand";

export type CreatorDemandPrefill = {
  clientId?: string;
  title?: string;
  description?: string;
  briefing?: string;
  creatorId?: string;
  sourceDemandId?: string;
  referenceFiles?: DemandFileRecord[];
  lockClient?: boolean;
  endpoint?: string;
};

export function CreatorDemandForm({
  clients,
  creators,
  prefill,
  onCancel,
  onSuccess,
}: {
  clients: ClientRecord[];
  creators: CreatorOption[];
  prefill?: CreatorDemandPrefill | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const lockedClient = prefill?.lockClient ? clients.find((client) => client.id === prefill.clientId) || null : null;
  const [selected, setSelected] = useState<ClientRecord | null>(
    lockedClient || clients.find((client) => client.id === prefill?.clientId) || null
  );
  const [files, setFiles] = useState<File[]>([]);
  const [keptFiles, setKeptFiles] = useState<DemandFileRecord[]>(prefill?.referenceFiles || []);
  const [loading, setLoading] = useState(false);
  const form = useForm<CreateCreatorDemandValues>({
    resolver: zodResolver(createCreatorDemandSchema),
    defaultValues: {
      clientId: prefill?.clientId || "",
      title: prefill?.title || "",
      creatorId: prefill?.creatorId || "",
      briefing: prefill?.briefing || "",
      description: prefill?.description || "",
      sourceDemandId: prefill?.sourceDemandId,
      referenceFileIds: (prefill?.referenceFiles || []).map((file) => file.id),
    },
  });

  async function onSubmit(values: CreateCreatorDemandValues) {
    setLoading(true);
    const response = await fetch(prefill?.endpoint || "/api/demandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        referenceFileIds: keptFiles.map((file) => file.id),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.demand?.id) {
      setLoading(false);
      toast.error(payload.error || "Não foi possível cadastrar a demanda.");
      if (payload.demand?.id) onSuccess();
      return;
    }
    if (files.length) {
      const uploaded = await uploadDemandFiles(payload.demand.id, files, "reference");
      if (uploaded.error) {
        setLoading(false);
        toast.warning(`Demanda cadastrada, mas as referências não foram anexadas. ${uploaded.error}`);
        onSuccess();
        return;
      }
    }
    setLoading(false);
    toast.success("Demanda cadastrada.");
    onSuccess();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Cliente</Label>
        <ClientSuggest
          clients={clients}
          value={selected}
          disabled={Boolean(prefill?.lockClient)}
          onChange={(client) => {
            setSelected(client);
            form.setValue("clientId", client?.id || "", { shouldValidate: true });
          }}
        />
        {form.formState.errors.clientId?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.clientId.message}</p>
        ) : null}
      </div>
      <CreatorDemandFields
        creators={creators}
        register={form.register}
        control={form.control}
        errors={form.formState.errors}
        files={files}
        keptFiles={keptFiles}
        onFiles={setFiles}
        onRemoveKept={(id) => setKeptFiles((current) => current.filter((file) => file.id !== id))}
      />
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
