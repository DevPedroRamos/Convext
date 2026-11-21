// Acesso a dados dos Espaços (server-only). As tabelas novas entram em types/database.types.ts
// ao regenerar os tipos; até lá o client é usado sem o genérico Database, como em lib/finance/data.ts.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { isMyTurn } from "@/lib/spaces/rules";
import type { StageOwner } from "@/lib/spaces/roles";
import type { AppNotification, FormField, QuickAction, Space, SpaceForm, SpaceStage, SpaceTask, TaskEvent } from "@/lib/spaces/types";
import type { SpaceFormValues, SpaceValues } from "@/lib/validations/spaces";

type Row = Record<string, unknown>;
type ProfileJoin = { id: string; first_name: string | null; last_name: string | null; email?: string | null } | null;
export type Result<T> = { data: T; error: null } | { data: null; error: string };

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const ok = <T,>(data: T): Result<T> => ({ data, error: null });
function fail<T>(error: { message?: string; code?: string } | string | null | undefined, fallback: string): Result<T> {
  if (!error) return { data: null, error: fallback };
  if (typeof error === "string") return { data: null, error };
  if (error.code === "42501" && !error.message) return { data: null, error: "Sem permissão para esta ação." };
  if (error.code === "23503") return { data: null, error: "Registro em uso por outro cadastro." };
  return { data: null, error: error.message || fallback };
}
const one = <T,>(value: unknown): T | null => (Array.isArray(value) ? ((value[0] as T) ?? null) : ((value as T) ?? null));
function personName(profile: ProfileJoin) {
  if (!profile) return null;
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email?.split("@")[0] || null;
}
const profileCols = "id, first_name, last_name, email";

function mapStage(row: Row): SpaceStage {
  return {
    id: row.id as string,
    spaceId: row.space_id as string,
    name: row.name as string,
    position: Number(row.position ?? 0),
    type: row.type as SpaceStage["type"],
    ownerRole: (row.owner_role as StageOwner | null) ?? null,
    requiresLabel: (row.requires_label as string | null) ?? null,
    notify: Boolean(row.notify),
    rejectTo: (row.reject_to as string | null) ?? null,
  };
}

function mapSpace(row: Row): Space {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    memberRoles: (row.member_roles as AppRole[]) ?? [],
    position: Number(row.position ?? 0),
    stages: ((row.stages as Row[]) ?? []).map(mapStage).sort((a, b) => a.position - b.position),
  };
}

export async function listSpaces(): Promise<Space[]> {
  const client = await db();
  const { data } = await client.from("spaces").select("*, stages:space_stages(*)").order("position").order("created_at");
  return (data ?? []).map(mapSpace);
}

export async function getSpace(id: string): Promise<Space | null> {
  const client = await db();
  const { data } = await client.from("spaces").select("*, stages:space_stages(*)").eq("id", id).maybeSingle();
  return data ? mapSpace(data) : null;
}

function mapForm(row: Row): SpaceForm {
  return {
    id: row.id as string,
    spaceId: row.space_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    audienceRoles: (row.audience_roles as AppRole[]) ?? [],
    fields: ((row.fields as FormField[]) ?? []).map((field) => ({ ...field, required: Boolean(field.required) })),
    active: Boolean(row.active),
    position: Number(row.position ?? 0),
  };
}

export async function listForms(): Promise<SpaceForm[]> {
  const client = await db();
  const { data } = await client.from("space_forms").select("*").order("position").order("created_at");
  return (data ?? []).map(mapForm);
}

export async function listQuickActions(): Promise<QuickAction[]> {
  const client = await db();
  const { data } = await client.from("quick_actions").select("*").order("position").order("created_at");
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    label: row.label as string,
    kind: row.kind as QuickAction["kind"],
    formId: (row.form_id as string | null) ?? null,
    systemAction: (row.system_action as QuickAction["systemAction"]) ?? null,
    audienceRoles: (row.audience_roles as AppRole[]) ?? [],
    position: Number(row.position ?? 0),
  }));
}

const taskSelect = `*, client:clients(id, name), assignee:profiles!space_tasks_assignee_id_fkey(${profileCols}), creator:profiles!space_tasks_created_by_fkey(${profileCols})`;

function mapTask(row: Row): SpaceTask {
  return {
    id: row.id as string,
    spaceId: row.space_id as string,
    formId: (row.form_id as string | null) ?? null,
    stageId: row.stage_id as string,
    title: row.title as string,
    clientId: (row.client_id as string | null) ?? null,
    clientName: one<{ name: string }>(row.client)?.name ?? null,
    values: Object.fromEntries(Object.entries((row.values as Record<string, unknown>) ?? {}).map(([key, value]) => [key, value == null ? "" : String(value)])),
    assigneeId: (row.assignee_id as string | null) ?? null,
    assigneeName: personName(one<ProfileJoin>(row.assignee)),
    createdBy: (row.created_by as string | null) ?? null,
    createdByName: personName(one<ProfileJoin>(row.creator)),
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Tarefas visíveis ao usuário (a RLS filtra). Concluídas só dos últimos 30 dias. */
export async function listTasks(filter: { spaceId?: string } = {}): Promise<SpaceTask[]> {
  const client = await db();
  const since = new Date(Date.now() - 30 * 86400e3).toISOString();
  let query = client.from("space_tasks").select(taskSelect).or(`completed_at.is.null,completed_at.gte.${since}`).order("created_at", { ascending: false }).limit(1000);
  if (filter.spaceId) query = query.eq("space_id", filter.spaceId);
  const { data } = await query;
  return (data ?? []).map(mapTask);
}

export async function getTaskEvents(taskId: string): Promise<TaskEvent[]> {
  const client = await db();
  const { data } = await client.from("space_task_events").select(`*, actor:profiles(${profileCols})`).eq("task_id", taskId).order("created_at");
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    actorName: personName(one<ProfileJoin>(row.actor)),
    kind: row.kind as TaskEvent["kind"],
    message: row.message as string,
    createdAt: row.created_at as string,
  }));
}

/** Quantas tarefas esperam pelo usuário, por espaço (sidebar e início). */
export async function countMyTurn(viewer: { id: string; role: AppRole }, spaces: Space[]) {
  const tasks = await listTasks();
  const stages = new Map(spaces.flatMap((space) => space.stages.map((stage) => [stage.id, stage] as const)));
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    const stage = stages.get(task.stageId);
    if (stage && isMyTurn(task, stage, viewer)) counts[task.spaceId] = (counts[task.spaceId] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Ações de tarefa (regras no banco)
// ---------------------------------------------------------------------------

export async function createTask(values: { formId: string; title: string; clientId?: string | null; values: Record<string, string> }): Promise<Result<string>> {
  const client = await db();
  const { data, error } = await client.rpc("space_create_task", { p_form_id: values.formId, p_title: values.title, p_client_id: values.clientId ?? null, p_values: values.values });
  return error || !data ? fail(error, "Não foi possível enviar.") : ok(data as string);
}

export async function runTaskAction(
  taskId: string,
  action: { action: "advance"; value?: string } | { action: "approve" } | { action: "reject"; reason: string } | { action: "claim" } | { action: "move"; stageId: string } | { action: "comment"; message: string },
): Promise<Result<true>> {
  const client = await db();
  const call = {
    advance: () => client.rpc("space_task_advance", { p_task_id: taskId, p_required_value: "value" in action ? action.value || null : null }),
    approve: () => client.rpc("space_task_approve", { p_task_id: taskId }),
    reject: () => client.rpc("space_task_reject", { p_task_id: taskId, p_reason: "reason" in action ? action.reason : "" }),
    claim: () => client.rpc("space_task_claim", { p_task_id: taskId }),
    move: () => client.rpc("space_task_move", { p_task_id: taskId, p_stage_id: "stageId" in action ? action.stageId : null }),
    comment: () => client.rpc("space_task_comment", { p_task_id: taskId, p_message: "message" in action ? action.message : "" }),
  }[action.action];
  const { error } = await call();
  return error ? fail(error, "Não foi possível concluir a ação.") : ok(true);
}

export async function deleteTask(taskId: string): Promise<Result<true>> {
  const client = await db();
  const { error } = await client.from("space_tasks").delete().eq("id", taskId);
  return error ? fail(error, "Não foi possível excluir.") : ok(true);
}

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const client = await db();
  const { data } = await client.from("notifications").select("*, task:space_tasks(space_id)").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    taskId: (row.task_id as string | null) ?? null,
    spaceId: one<{ space_id: string }>(row.task)?.space_id ?? null,
    message: row.message as string,
    readAt: (row.read_at as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function markNotificationsRead(userId: string): Promise<Result<true>> {
  const client = await db();
  const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  return error ? fail(error, "Não foi possível atualizar os avisos.") : ok(true);
}

// ---------------------------------------------------------------------------
// Configuração (admin; a RLS exige profile_is_admin)
// ---------------------------------------------------------------------------

/**
 * Salva o espaço e substitui o fluxo: atualiza etapas existentes, cria as novas e remove as retiradas.
 * Tarefas de uma etapa removida vão para a etapa anterior que sobrou (ou a primeira).
 */
export async function saveSpace(id: string | null, values: SpaceValues): Promise<Result<string>> {
  const client = await db();
  const base = { name: values.name.trim(), color: values.color, member_roles: values.memberRoles };
  let spaceId = id;
  if (spaceId) {
    const { error } = await client.from("spaces").update(base).eq("id", spaceId);
    if (error) return fail(error, "Não foi possível salvar o espaço.");
  } else {
    const { count } = await client.from("spaces").select("id", { count: "exact", head: true });
    const { data, error } = await client.from("spaces").insert({ ...base, position: count ?? 0 }).select("id").single();
    if (error || !data) return fail(error, "Não foi possível criar o espaço.");
    spaceId = data.id as string;
  }

  const existing = await client.from("space_stages").select("id, position").eq("space_id", spaceId).order("position");
  if (existing.error) return fail(existing.error, "Não foi possível ler o fluxo.");
  const existingIds = new Set((existing.data ?? []).map((row) => row.id as string));

  // 1) grava etapas na ordem nova (sem reject_to, que pode apontar para etapas ainda não criadas)
  const ids: string[] = [];
  for (const [position, stage] of values.stages.entries()) {
    const row = {
      space_id: spaceId,
      name: stage.name.trim(),
      position,
      type: stage.type,
      owner_role: stage.type === "done" ? null : stage.ownerRole,
      requires_label: stage.type === "done" ? null : stage.requiresLabel?.trim() || null,
      notify: stage.notify,
      reject_to: null,
    };
    if (stage.id && existingIds.has(stage.id)) {
      const { error } = await client.from("space_stages").update(row).eq("id", stage.id);
      if (error) return fail(error, "Não foi possível salvar a etapa.");
      ids.push(stage.id);
    } else {
      const { data, error } = await client.from("space_stages").insert(row).select("id").single();
      if (error || !data) return fail(error, "Não foi possível criar a etapa.");
      ids.push(data.id as string);
    }
  }

  // 2) recusa: resolve referências por id existente ou por "#índice"
  for (const [index, stage] of values.stages.entries()) {
    if (stage.type !== "approval" || !stage.rejectTo) continue;
    const target = stage.rejectTo.startsWith("#") ? ids[Number(stage.rejectTo.slice(1))] : ids[values.stages.findIndex((item) => item.id === stage.rejectTo)];
    if (target && target !== ids[index]) await client.from("space_stages").update({ reject_to: target }).eq("id", ids[index]);
  }

  // 3) remove etapas retiradas, movendo as tarefas para a etapa anterior que sobrou
  const kept = new Set(ids);
  const removed = (existing.data ?? []).filter((row) => !kept.has(row.id as string));
  for (const row of removed) {
    const fallbackIndex = Math.max(0, Math.min(Number(row.position) - 1, ids.length - 1));
    const fallback = ids[fallbackIndex] ?? ids[0];
    const moved = await client.from("space_tasks").update({ stage_id: fallback }).eq("stage_id", row.id);
    if (moved.error) return fail(moved.error, "Não foi possível mover as tarefas da etapa removida.");
    const { error } = await client.from("space_stages").delete().eq("id", row.id);
    if (error) return fail(error, "Não foi possível remover a etapa.");
  }
  return ok(spaceId);
}

export async function deleteSpace(id: string): Promise<Result<true>> {
  const client = await db();
  const tasks = await client.from("space_tasks").delete().eq("space_id", id);
  if (tasks.error) return fail(tasks.error, "Não foi possível excluir as tarefas do espaço.");
  const { error } = await client.from("spaces").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir o espaço.") : ok(true);
}

export async function saveForm(id: string | null, values: SpaceFormValues): Promise<Result<string>> {
  const client = await db();
  const row = {
    space_id: values.spaceId,
    name: values.name.trim(),
    description: values.description?.trim() || null,
    audience_roles: values.audienceRoles,
    active: values.active,
    fields: values.fields.map((field) => ({ key: field.key, label: field.label.trim(), type: field.type, required: field.key === "titulo" ? true : field.required, ...(field.type === "select" ? { options: field.options ?? "" } : {}) })),
  };
  const result = id ? await client.from("space_forms").update(row).eq("id", id).select("id").single() : await client.from("space_forms").insert(row).select("id").single();
  return result.error || !result.data ? fail(result.error, "Não foi possível salvar o formulário.") : ok(result.data.id as string);
}

export async function deleteForm(id: string): Promise<Result<true>> {
  const client = await db();
  const { error } = await client.from("space_forms").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir o formulário.") : ok(true);
}

export async function saveQuickActions(actions: { id?: string; label: string; kind: "form" | "system"; formId?: string | null; systemAction?: string | null; audienceRoles: AppRole[] }[]): Promise<Result<true>> {
  const client = await db();
  const current = await client.from("quick_actions").select("id");
  if (current.error) return fail(current.error, "Não foi possível ler os atalhos.");
  const keep = new Set(actions.map((action) => action.id).filter(Boolean) as string[]);
  const removed = (current.data ?? []).map((row) => row.id as string).filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await client.from("quick_actions").delete().in("id", removed);
    if (error) return fail(error, "Não foi possível remover atalhos.");
  }
  for (const [position, action] of actions.entries()) {
    const row = {
      label: action.label.trim(),
      kind: action.kind,
      form_id: action.kind === "form" ? action.formId ?? null : null,
      system_action: action.kind === "system" ? action.systemAction ?? null : null,
      audience_roles: action.audienceRoles,
      position,
    };
    const { error } = action.id ? await client.from("quick_actions").update(row).eq("id", action.id) : await client.from("quick_actions").insert(row);
    if (error) return fail(error, "Não foi possível salvar os atalhos.");
  }
  return ok(true);
}
