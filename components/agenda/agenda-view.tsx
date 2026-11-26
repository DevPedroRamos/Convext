"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { type AttendeeOption } from "@/components/spaces/appointment-field";
import { type ClientOption, TaskFormDialog } from "@/components/spaces/task-form-dialog";
import { TaskSheet } from "@/components/spaces/task-sheet";
import { EventManager, type CalendarEventItem } from "@/components/ui/event-manager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FeedbackType } from "@/lib/feedback-types";
import { canReschedule, canSubmitForm, type Viewer } from "@/lib/spaces/rules";
import type { Space, SpaceForm, SpaceTask, TaskAppointment } from "@/lib/spaces/types";

export function AgendaView({
  appointments,
  tasks,
  spaces,
  forms,
  clients,
  attendees,
  feedbackTypes = [],
  viewer,
}: {
  appointments: TaskAppointment[];
  tasks: SpaceTask[];
  spaces: Space[];
  forms: SpaceForm[];
  clients: ClientOption[];
  attendees: AttendeeOption[];
  feedbackTypes?: FeedbackType[];
  viewer: Viewer;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [spaceId, setSpaceId] = useState("all");
  const [personId, setPersonId] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<SpaceForm | null>(null);

  const ops = canReschedule(viewer.role);
  const bookable = forms.filter((form) => form.fields.some((field) => field.type === "appointment") && canSubmitForm(form, viewer.role));
  const filtered = useMemo(() => appointments.filter((item) => {
    if (spaceId !== "all" && item.spaceId !== spaceId) return false;
    if (personId !== "all" && !item.attendees.some((attendee) => attendee.id === personId)) return false;
    return true;
  }), [appointments, spaceId, personId]);

  const events: CalendarEventItem[] = filtered.map((item) => ({
    id: item.id,
    title: item.title ?? "Compromisso",
    start: item.startsAt,
    end: item.endsAt,
    color: item.spaceColor ?? "#f35703",
    location: item.location || undefined,
  }));

  const selected = selectedId ? tasks.find((task) => task.id === selectedId) ?? null : null;
  const selectedSpace = selected ? spaces.find((space) => space.id === selected.spaceId) ?? null : null;

  return (
    <div className="grid gap-4">
      <EventManager
        events={events}
        onEventClick={(event) => {
          const appointment = filtered.find((item) => item.id === event.id);
          if (appointment) setSelectedId(appointment.taskId);
        }}
        onRangeChange={(range) => {
          if (params.get("de") === range.from && params.get("ate") === range.to) return;
          const next = new URLSearchParams(params.toString());
          next.set("de", range.from);
          next.set("ate", range.to);
          router.replace(`/app/agenda?${next.toString()}`, { scroll: false });
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger className="w-44" aria-label="Filtrar espaço"><SelectValue placeholder="Espaço" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os espaços</SelectItem>
                {spaces.map((space) => <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {ops ? (
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger className="w-44" aria-label="Filtrar pessoa"><SelectValue placeholder="Pessoa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda a equipe</SelectItem>
                  {attendees.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            {bookable.length ? (
              <Select onValueChange={(id) => setOpenForm(bookable.find((form) => form.id === id) ?? null)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Novo compromisso" /></SelectTrigger>
                <SelectContent>
                  {bookable.map((form) => {
                    const space = spaces.find((item) => item.id === form.spaceId);
                    return <SelectItem key={form.id} value={form.id}>{space ? `${space.name} · ${form.name}` : form.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        }
      />
      {!filtered.length ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum compromisso neste período.</p> : null}

      <TaskSheet
        task={selected}
        space={selectedSpace}
        form={selected ? forms.find((form) => form.id === selected.formId) ?? null : null}
        viewer={viewer}
        attendees={attendees}
        clients={clients}
        feedbackTypes={feedbackTypes}
        onClose={() => setSelectedId(null)}
      />
      <TaskFormDialog
        form={openForm}
        space={openForm ? spaces.find((space) => space.id === openForm.spaceId) ?? null : null}
        clients={clients}
        attendees={attendees}
        onOpenChange={(open) => !open && setOpenForm(null)}
        onSent={() => router.refresh()}
      />
    </div>
  );
}
