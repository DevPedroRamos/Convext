"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spacesRequest } from "@/components/spaces/api";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppointmentField, type AttendeeOption } from "@/components/spaces/appointment-field";
import { GalleryField } from "@/components/spaces/gallery-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackType } from "@/lib/feedback-types";
import { ownerLabel } from "@/lib/spaces/roles";
import { firstMissingField, orderedStages, selectOptions } from "@/lib/spaces/rules";
import type { FormField, Space, SpaceForm } from "@/lib/spaces/types";
import type { AppointmentInput } from "@/lib/validations/spaces";

export type ClientOption = { id: string; name: string };
export type FeedbackTypeOption = Pick<FeedbackType, "name" | "solution">;

type Props = {
  form: SpaceForm | null;
  space: Space | null;
  clients: ClientOption[];
  attendees?: AttendeeOption[];
  feedbackTypes?: FeedbackTypeOption[];
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
};

export function TaskFormDialog({ form, space, clients, attendees = [], feedbackTypes = [], onOpenChange, onSent }: Props) {
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
            <TaskForm key={form.id} form={form} space={space} clients={clients} attendees={attendees} feedbackTypes={feedbackTypes} onCancel={() => onOpenChange(false)} onSent={() => { onOpenChange(false); onSent?.(); }} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskForm({ form, space, clients, attendees, feedbackTypes, onCancel, onSent }: { form: SpaceForm; space: Space; clients: ClientOption[]; attendees: AttendeeOption[]; feedbackTypes: FeedbackTypeOption[]; onCancel: () => void; onSent: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const appointmentField = form.fields.find((field) => field.type === "appointment");
  const [appointment, setAppointment] = useState<AppointmentInput | null>(appointmentField?.required ? { startsAt: "", durationMinutes: 60, location: "", attendeeIds: [] } : null);
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
    const missing = firstMissingField(form.fields, values, clientId, appointment);
    if (missing) {
      setError(`Preencha: ${missing}.`);
      return;
    }
    if (appointment && (!appointment.startsAt || !appointment.attendeeIds.length)) {
      setError("Preencha data, hora e participantes do compromisso.");
      return;
    }
    setError(null);
    setLoading(true);
    const extra = Object.fromEntries(Object.entries(values).filter(([key]) => key !== "titulo" && key !== clientField?.key));
    const payload = appointment && appointment.startsAt && appointment.attendeeIds.length ? appointment : undefined;
    const id = await spacesRequest<string>("/api/spaces/tasks", "POST", { formId: form.id, title: values.titulo ?? "", clientId, values: extra, appointment: payload }, `Enviado para ${space.name}.`);
    setLoading(false);
    if (!id) return;
    onSent();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {form.fields.map((field) => (
        <FieldInput key={field.key} field={field} value={values[field.key] ?? ""} clients={clients} attendees={attendees} appointment={appointment} feedbackTypes={feedbackTypes} solution={values.solucao} onChange={(value) => set(field.key, value)} onAppointmentChange={setAppointment} onSolutionChange={(solucao) => set("solucao", solucao)} />
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

export function FieldInput({ field, value, clients, attendees = [], appointment = null, feedbackTypes = [], solution, onChange, onAppointmentChange, onSolutionChange, disabled }: { field: FormField; value: string; clients: ClientOption[]; attendees?: AttendeeOption[]; appointment?: AppointmentInput | null; feedbackTypes?: FeedbackTypeOption[]; solution?: string; onChange: (value: string) => void; onAppointmentChange?: (value: AppointmentInput | null) => void; onSolutionChange?: (solution: string) => void; disabled?: boolean }) {
  const label = `${field.label}${field.required ? " *" : ""}`;
  if (field.type === "longtext") {
    return <Field label={label}><Textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></Field>;
  }
  if (field.type === "client") {
    return (
      <Field label={label}>
        <SearchableSelect value={value} onValueChange={onChange} options={clients.map((client) => ({ value: client.id, label: client.name }))} disabled={disabled} />
      </Field>
    );
  }
  if (field.type === "feedback") {
    const chosen = feedbackTypes.find((type) => type.name === value);
    return (
      <div className="grid gap-3">
        <Field label={label}>
          <SearchableSelect
            value={value}
            onValueChange={(next) => {
              onChange(next);
              onSolutionChange?.(feedbackTypes.find((type) => type.name === next)?.solution ?? "");
            }}
            options={feedbackTypes.map((type) => ({ value: type.name, label: type.name }))}
            disabled={disabled}
          />
        </Field>
        {value ? (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-line">
            <p className="mb-1 text-xs text-muted-foreground">Solução</p>
            {chosen?.solution.trim() || solution?.trim() || "Sem solução cadastrada."}
          </div>
        ) : null}
      </div>
    );
  }
  if (field.type === "gallery") {
    return <GalleryField label={label} fieldKey={field.key} value={value} onChange={onChange} disabled={disabled} />;
  }
  if (field.type === "appointment") {
    return <AppointmentField required={field.required} value={appointment} attendees={attendees} onChange={(next) => onAppointmentChange?.(next)} disabled={disabled} />;
  }
  if (field.type === "select") {
    const options = selectOptions(field).map((option) => ({ value: option, label: option }));
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
