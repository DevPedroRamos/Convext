"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DatePartsField } from "@/components/forms/date-parts-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRecord } from "@/lib/clients";
import { demandPriorityLabel } from "@/lib/demand-labels";
import { createFeedbackSchema, demandPriorities, type CreateFeedbackValues } from "@/lib/validations/demand";

type FeedbackFormProps = {
  clients: ClientRecord[];
  onSuccess: () => void;
  onCancel: () => void;
};

export function FeedbackForm({ clients, onSuccess, onCancel }: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<CreateFeedbackValues>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: { clientId: "", description: "", priority: "medium", dueOn: "" },
  });
  const [selected, setSelected] = useState<ClientRecord | null>(null);

  async function onSubmit(values: CreateFeedbackValues) {
    setLoading(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: values.clientId,
        description: values.description,
        priority: values.priority,
        dueOn: values.dueOn,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível cadastrar.");
      return;
    }
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

function ClientSuggest({
  clients,
  value,
  onChange,
}: {
  clients: ClientRecord[];
  value: ClientRecord | null;
  onChange: (client: ClientRecord | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = term
      ? clients.filter((client) => {
          const haystack = [client.name, client.whatsapp, client.company].filter(Boolean).join(" ").toLowerCase();
          return haystack.includes(term);
        })
      : clients;
    return list.slice(0, 8);
  }, [clients, query]);

  return (
    <div className="relative">
      <Input
        value={value && !open ? `${value.name} · ${value.company}` : query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (value) onChange(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Buscar por nome, número ou empresa"
      />
      {open ? (
        <div className="mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {matches.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            matches.map((client) => (
              <button
                key={client.id}
                type="button"
                className="grid w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(client);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="font-medium">{client.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[client.company, client.whatsapp].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
