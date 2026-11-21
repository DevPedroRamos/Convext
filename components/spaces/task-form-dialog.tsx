"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spacesRequest } from "@/components/spaces/api";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ownerLabel } from "@/lib/spaces/roles";
import { firstMissingField, orderedStages, selectOptions } from "@/lib/spaces/rules";
import type { FormField, Space, SpaceForm } from "@/lib/spaces/types";

export type ClientOption = { id: string; name: string };

type Props = {
  form: SpaceForm | null;
  space: Space | null;
  clients: ClientOption[];
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
};

export function TaskFormDialog({ form, space, clients, onOpenChange, onSent }: Props) {
  return (
    <Sheet open={Boolean(form)} onOpenChange={onOpenChange}>
      <SheetContent size="panel">
        {form && space ? (
          <>
            <SheetHeader>
              <p className="label text-primary">{space.name}</p>
              <SheetTitle>{form.name}</SheetTitle>
              {form.description ? <SheetDescription>{form.description}</SheetDescription> : <SheetDescription>Preencha para abrir uma tarefa.</SheetDescription>}
            </SheetHeader>
            <TaskForm key={form.id} form={form} space={space} clients={clients} onCancel={() => onOpenChange(false)} onSent={() => { onOpenChange(false); onSent?.(); }} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskForm({ form, space, clients, onCancel, onSent }: { form: SpaceForm; space: Space; clients: ClientOption[]; onCancel: () => void; onSent: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const first = orderedStages(space)[0];
  const clientField = form.fields.find((field) => field.type === "client");

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const clientId = clientField ? values[clientField.key] || null : null;
    const missing = firstMissingField(form.fields, values, clientId);
    if (missing) {
      setError(`Preencha: ${missing}.`);
      return;
    }
    setError(null);
    setLoading(true);
    const extra = Object.fromEntries(Object.entries(values).filter(([key]) => key !== "titulo" && key !== clientField?.key));
    const id = await spacesRequest<string>("/api/spaces/tasks", "POST", { formId: form.id, title: values.titulo ?? "", clientId, values: extra }, `Enviado para ${space.name}.`);
    setLoading(false);
    if (!id) return;
    onSent();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {form.fields.map((field) => (
        <FieldInput key={field.key} field={field} value={values[field.key] ?? ""} clients={clients} onChange={(value) => set(field.key, value)} />
      ))}
      {first ? (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Ao enviar, a tarefa entra em <span className="text-foreground">{first.name}</span> e vai para <span className="text-foreground">{ownerLabel(first.ownerRole)}</span>.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Enviar</Button>
      </div>
    </form>
  );
}

export function FieldInput({ field, value, clients, onChange, disabled }: { field: FormField; value: string; clients: ClientOption[]; onChange: (value: string) => void; disabled?: boolean }) {
  const label = `${field.label}${field.required ? " *" : ""}`;
  if (field.type === "longtext") {
    return <Field label={label}><Textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></Field>;
  }
  if (field.type === "select" || field.type === "client") {
    const options = field.type === "client" ? clients.map((client) => ({ value: client.id, label: client.name })) : selectOptions(field).map((option) => ({ value: option, label: option }));
    return (
      <Field label={label}>
        <Select value={value || "none"} onValueChange={(next) => onChange(next === "none" ? "" : next)} disabled={disabled}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Escolha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Escolha</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }
  const type = field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "link" ? "url" : "text";
  return <Field label={label}><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></Field>;
}
