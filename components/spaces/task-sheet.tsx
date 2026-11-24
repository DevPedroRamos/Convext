"use client";

import { Check, Hand, Loader2, Send, Trash, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { spacesRequest } from "@/components/spaces/api";
import { AppointmentField, type AttendeeOption } from "@/components/spaces/appointment-field";
import { GalleryThumbs } from "@/components/spaces/gallery-field";
import { timeAgo } from "@/components/spaces/task-card";
import { TaskHistory } from "@/components/spaces/task-history";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ownerLabel } from "@/lib/spaces/roles";
import { parseGallery } from "@/lib/spaces/gallery";
import { canAct, canClaim, canReschedule, missingRequirement, nextStage, orderedStages, rejectTarget, type Viewer } from "@/lib/spaces/rules";
import type { Space, SpaceForm, SpaceTask, TaskEvent } from "@/lib/spaces/types";
import type { AppointmentInput } from "@/lib/validations/spaces";
import { cn } from "@/lib/utils";

type Props = { task: SpaceTask | null; space: Space | null; form: SpaceForm | null; viewer: Viewer; attendees?: AttendeeOption[]; onClose: () => void };

export function TaskSheet({ task, space, form, viewer, attendees = [], onClose }: Props) {
  return (
    <Sheet open={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="panel">
        {task && space ? <TaskDetail key={`${task.id}:${task.stageId}:${task.updatedAt}`} task={task} space={space} form={form} viewer={viewer} attendees={attendees} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function toInput(task: SpaceTask): AppointmentInput | null {
  const item = task.appointment;
  if (!item) return null;
  return {
    startsAt: item.startsAt,
    durationMinutes: Math.max(15, Math.round((new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60000)),
    location: item.location,
    attendeeIds: item.attendees.map((attendee) => attendee.id),
  };
}

function TaskDetail({ task, space, form, viewer, attendees, onClose }: { task: SpaceTask; space: Space; form: SpaceForm | null; viewer: Viewer; attendees: AttendeeOption[]; onClose: () => void }) {
  const router = useRouter();
  const stages = orderedStages(space);
  const stage = stages.find((item) => item.id === task.stageId) ?? stages[0];
  const index = stages.indexOf(stage);
  const next = nextStage(space, stage.id);
  const act = canAct(task, stage, viewer);
  const missing = missingRequirement(task, stage);
  const [busy, setBusy] = useState<string | null>(null);
  const [requirement, setRequirement] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [events, setEvents] = useState<TaskEvent[] | null>(null);
  const [moveTo, setMoveTo] = useState(stage.id);
  const [editingAppointment, setEditingAppointment] = useState(false);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentInput | null>(() => toInput(task));

  async function loadEvents() {
    const payload = await fetch(`/api/spaces/tasks/${task.id}`).then((response) => response.json()).catch(() => ({}));
    setEvents(payload.data ?? []);
  }

  useEffect(() => {
    let alive = true;
    fetch(`/api/spaces/tasks/${task.id}`).then((response) => response.json()).then((payload) => alive && setEvents(payload.data ?? [])).catch(() => alive && setEvents([]));
    return () => { alive = false; };
  }, [task.id]);

  async function run(key: string, body: Record<string, unknown>, success: string) {
    setBusy(key);
    const done = await spacesRequest(`/api/spaces/tasks/${task.id}`, "POST", body, success);
    setBusy(null);
    if (done) {
      router.refresh();
      await loadEvents();
    }
    return done;
  }

  async function remove() {
    if (!window.confirm(`Excluir “${task.title}”?`)) return;
    if (await spacesRequest(`/api/spaces/tasks/${task.id}`, "DELETE", undefined, "Tarefa excluída.")) {
      onClose();
      router.refresh();
    }
  }

  const fields = (form?.fields ?? []).filter((field) => field.key !== "titulo" && field.type !== "client" && field.type !== "appointment");
  const schedule = canReschedule(viewer.role);
  const required = stages.filter((item) => item.requiresLabel && task.values[item.requiresLabel]);

  return (
    <div className="grid gap-5 pt-2">
      <SheetHeader className="px-0">
        <p className="label text-primary">{space.name}</p>
        <SheetTitle className="text-xl">{task.title}</SheetTitle>
        <SheetDescription>Aberta por {task.createdByName ?? "—"} · {timeAgo(task.createdAt)}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-wrap gap-1.5">
        {stages.map((item, i) => (
          <span key={item.id} className={cn("rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground", i < index && "border-emerald-500/40 text-emerald-400", i === index && "border-primary bg-primary/10 text-foreground")}>
            {item.name}
          </span>
        ))}
      </div>

      {stage.type === "done" ? (
        <div className="rounded-lg border border-emerald-500/40 p-4 text-sm text-emerald-300">Tarefa concluída.</div>
      ) : act && stage.type === "approval" ? (
        <div className="grid gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4">
          <p className="font-medium">Sua aprovação</p>
          <p className="text-sm text-muted-foreground">Aprovar envia para {next?.name ?? "a próxima etapa"}. Recusar devolve para {rejectTarget(space, stage)?.name ?? "a etapa anterior"}.</p>
          {rejecting ? (
            <>
              <Field label="Motivo da recusa *"><Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} autoFocus /></Field>
              <div className="flex gap-2">
                <Button variant="destructive" disabled={busy === "reject"} onClick={async () => { if (await run("reject", { action: "reject", reason }, "Tarefa devolvida.")) setRejecting(false); }}>
                  {busy === "reject" ? <Loader2 className="animate-spin" /> : <X />} Recusar e devolver
                </Button>
                <Button variant="ghost" onClick={() => setRejecting(false)}>Cancelar</Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button disabled={busy === "approve"} onClick={() => run("approve", { action: "approve" }, "Aprovada.")}>{busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />} Aprovar</Button>
              <Button variant="outline" onClick={() => setRejecting(true)}><X /> Recusar</Button>
            </div>
          )}
        </div>
      ) : act ? (
        <div className="grid gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4">
          <p className="font-medium">Sua vez: {stage.name}</p>
          {missing ? (
            <Field label={`${missing} *`} hint="Necessário para concluir esta etapa.">
              <Input value={requirement} onChange={(event) => setRequirement(event.target.value)} placeholder="Cole o link ou escreva aqui" />
            </Field>
          ) : null}
          <div>
            <Button
              disabled={busy === "advance" || Boolean(missing && !requirement.trim())}
              onClick={() => run("advance", { action: "advance", value: missing ? requirement : undefined }, next?.type === "done" ? "Tarefa concluída." : `Enviada para ${next?.name}.`)}
            >
              {busy === "advance" ? <Loader2 className="animate-spin" /> : <Send />} {next ? (next.type === "done" ? "Concluir tarefa" : `Concluir e enviar para ${next.name}`) : "Concluir"}
            </Button>
          </div>
          {next && next.type !== "done" ? <p className="text-xs text-muted-foreground">Vai para: {ownerLabel(next.ownerRole)}{next.type === "approval" ? " (aprovação)" : ""}</p> : null}
        </div>
      ) : (
        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Aguardando <span className="text-foreground">{task.assigneeName ?? ownerLabel(stage.ownerRole)}</span> em {stage.name}.
        </div>
      )}

      {canClaim(task, stage, viewer) && viewer.role !== "admin" ? (
        <Button variant="outline" className="w-fit" disabled={busy === "claim"} onClick={() => run("claim", { action: "claim" }, "A tarefa é sua.")}><Hand /> Pegar para mim</Button>
      ) : null}

      {task.appointment || editingAppointment ? (
        <div className="grid gap-3 rounded-lg border border-border p-4">
          <p className="font-medium">Compromisso</p>
          {editingAppointment ? (
            <>
              <AppointmentField required value={appointmentDraft} attendees={attendees} onChange={setAppointmentDraft} />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy === "reschedule" || !appointmentDraft?.startsAt || !appointmentDraft.attendeeIds.length}
                  onClick={async () => {
                    if (!appointmentDraft) return;
                    if (await run("reschedule", { action: "reschedule", appointment: appointmentDraft }, "Compromisso remarcado.")) setEditingAppointment(false);
                  }}
                >
                  {busy === "reschedule" ? <Loader2 className="animate-spin" /> : null}Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingAppointment(false); setAppointmentDraft(toInput(task)); }}>Cancelar</Button>
              </div>
            </>
          ) : task.appointment ? (
            <>
              <p className="text-sm">
                {new Date(task.appointment.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                {" · "}
                {Math.round((new Date(task.appointment.endsAt).getTime() - new Date(task.appointment.startsAt).getTime()) / 60000)} min
              </p>
              {task.appointment.location ? <p className="text-sm text-muted-foreground">{task.appointment.location}</p> : null}
              <p className="text-sm text-muted-foreground">{task.appointment.attendees.map((item) => item.name).join(", ") || "—"}</p>
              {schedule ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setAppointmentDraft(toInput(task)); setEditingAppointment(true); }}>Remarcar</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === "unschedule"} onClick={() => run("unschedule", { action: "unschedule" }, "Compromisso removido.")}>Remover</Button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <dl className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Cliente</dt>
        <dd>{task.clientName ?? <span className="text-muted-foreground">Sem cliente</span>}</dd>
        <dt className="text-muted-foreground">Responsável</dt>
        <dd>{task.assigneeName ?? <span className="text-muted-foreground">{stage.type === "done" ? "—" : `Fila de ${ownerLabel(stage.ownerRole)}`}</span>}</dd>
        {fields.map((field) => (
          <Fragment key={field.key}>
            {field.type === "gallery" ? (
              <>
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd><GalleryThumbs urls={parseGallery(task.values[field.key])} /></dd>
              </>
            ) : (
              <FieldRow label={field.label} value={task.values[field.key]} />
            )}
            {field.type === "feedback" ? <FieldRow label="Solução" value={task.values.solucao} /> : null}
          </Fragment>
        ))}
        {required.map((item) => (
          <FieldRow key={item.id} label={item.requiresLabel!} value={task.values[item.requiresLabel!]} />
        ))}
      </dl>

      {viewer.role === "admin" ? (
        <div className="grid gap-2 rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Admin</p>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={moveTo} onValueChange={setMoveTo}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Mover para a etapa"><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={moveTo === stage.id || busy === "move"} onClick={() => run("move", { action: "move", stageId: moveTo }, "Tarefa movida.")}>Mover</Button>
            <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={remove}><Trash /> Excluir</Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        <p className="label">Histórico</p>
        {events === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : <TaskHistory events={events} />}
        <form
          className="flex gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!comment.trim()) return;
            if (await run("comment", { action: "comment", message: comment }, "Comentário enviado.")) setComment("");
          }}
        >
          <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Escreva um comentário" aria-label="Comentário" />
          <Button variant="outline" disabled={busy === "comment"}>Enviar</Button>
        </form>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | undefined }) {
  const isLink = value && /^(https?:\/\/|www\.)/i.test(value);
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words whitespace-pre-line">
        {!value ? <span className="text-muted-foreground">—</span> : isLink ? <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{value}</a> : value}
      </dd>
    </>
  );
}
