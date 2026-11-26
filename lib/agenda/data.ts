import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/access";
import { profileName } from "@/lib/profile";
import { mapAppointment } from "@/lib/spaces/data";
import type { TaskAppointment } from "@/lib/spaces/types";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
const profileCols = "id, first_name, last_name, email";

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export type AttendeeOption = { id: string; name: string; role?: AppRole };

export async function listAppointments({ from, to, userId }: { from: string; to: string; userId?: string }): Promise<TaskAppointment[]> {
  const client = await db();
  const { data } = await client
    .from("task_appointments")
    .select(`id, task_id, starts_at, ends_at, location, attendees:task_appointment_attendees(user_id, profile:profiles(${profileCols})), task:space_tasks(id, title, space_id, space:spaces(id, name, color))`)
    .lt("starts_at", to)
    .gt("ends_at", from)
    .order("starts_at")
    .limit(500);
  const items = ((data ?? []) as Row[]).map((row) => mapAppointment(row)).filter((item): item is TaskAppointment => Boolean(item));
  if (!userId) return items;
  return items.filter((item) => item.attendees.some((attendee) => attendee.id === userId));
}

export async function listAttendeeOptions(): Promise<AttendeeOption[]> {
  const client = await db();
  const { data } = await client
    .from("profiles")
    .select("id, first_name, last_name, email, role")
    .in("role", ["admin", "coordinator", "traffic", "creator", "commercial"])
    .order("first_name");
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    name: profileName({ first_name: row.first_name as string | null, last_name: row.last_name as string | null }, row.email as string | null),
    role: row.role as AppRole,
  }));
}
