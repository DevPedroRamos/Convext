import { callRpc } from "@/lib/communication/rpc";
import { CommunicationError } from "@/lib/communication/errors";
import type { RoomRecord } from "@/types/communication";

type AnyClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => any;
};

function mapRoom(row: Record<string, unknown>, extras: Partial<RoomRecord> = {}): RoomRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    access: row.access as RoomRecord["access"],
    ownerId: String(row.owner_id),
    lockedAt: (row.locked_at as string | null) ?? null,
    archivedAt: (row.archived_at as string | null) ?? null,
    version: Number(row.version),
    createdAt: String(row.created_at),
    participantCount: extras.participantCount ?? 0,
    live: extras.live ?? false,
    memberRole: extras.memberRole ?? null,
    participantAvatars: extras.participantAvatars ?? [],
  };
}

export async function listRooms(client: AnyClient, userId: string, query = "") {
  const { data, error } = await client.from("communication_rooms").select("*").is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw new CommunicationError("ACTION_DENIED", error.message, true);
  const rooms = ((data || []) as Record<string, unknown>[]).filter((row) => {
    if (!query) return true;
    const haystack = `${row.name} ${row.description || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const ids = rooms.map((row) => String(row.id));
  const members = ids.length
    ? ((await client.from("communication_room_members").select("room_id,user_id,role").in("room_id", ids)).data || []) as Record<string, unknown>[]
    : [];
  const sessions = ids.length
    ? ((await client.from("communication_sessions").select("id,room_id,state").in("room_id", ids)).data || []) as Record<string, unknown>[]
    : [];
  const liveSessions = sessions.filter((session) => session.state !== "ended");
  const sessionIds = liveSessions.map((session) => String(session.id));
  const parts = sessionIds.length
    ? ((await client.from("communication_participations").select("session_id,user_id,state").in("session_id", sessionIds)).data || []) as Record<string, unknown>[]
    : [];
  const profiles = ((await client.from("profiles").select("id,first_name,last_name,avatar_url")).data || []) as Record<string, unknown>[];
  const profileById = new Map(profiles.map((profile) => [String(profile.id), profile]));

  return rooms.map((row) => {
    const roomId = String(row.id);
    const member = members.find((item) => item.room_id === roomId && item.user_id === userId);
    const session = liveSessions.find((item) => item.room_id === roomId);
    const liveParts = parts.filter((part) => part.session_id === session?.id && ["joined", "reconnecting", "reserved"].includes(String(part.state)));
    const avatars = liveParts.slice(0, 4).map((part) => {
      const profile = profileById.get(String(part.user_id));
      return {
        id: String(part.user_id),
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Pessoa",
        avatarUrl: (profile?.avatar_url as string | null) ?? null,
      };
    });
    return mapRoom(row, {
      memberRole: (member?.role as RoomRecord["memberRole"]) ?? null,
      participantCount: liveParts.length,
      live: liveParts.length > 0,
      participantAvatars: avatars,
    });
  });
}

export async function getRoom(client: AnyClient, userId: string, roomId: string) {
  const { data, error } = await client.from("communication_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw new CommunicationError("ACTION_DENIED", error.message, true);
  if (!data) throw new CommunicationError("ROOM_UNAVAILABLE", "Sala indisponível.");
  const listed = (await listRooms(client, userId)).find((item) => item.id === roomId);
  return listed || mapRoom(data as Record<string, unknown>);
}

export async function createRoom(client: AnyClient, input: { name: string; description?: string | null; access: "open" | "private"; inviteeIds: string[] }) {
  const row = await callRpc<Record<string, unknown>>(client, "communication_create_room", {
    p_name: input.name,
    p_description: input.description ?? "",
    p_access: input.access,
    p_invitee_ids: input.inviteeIds,
  });
  return mapRoom(row);
}

export async function updateRoom(client: AnyClient, roomId: string, input: { expectedVersion: number; name?: string; description?: string | null; access?: "open" | "private"; locked?: boolean }) {
  const row = await callRpc<Record<string, unknown>>(client, "communication_update_room", {
    p_room_id: roomId,
    p_expected_version: input.expectedVersion,
    p_name: input.name ?? "",
    p_description: input.description ?? null,
    p_access: input.access ?? null,
    p_locked: input.locked ?? null,
  });
  return mapRoom(row);
}

export async function archiveRoom(client: AnyClient, roomId: string, expectedVersion: number) {
  return callRpc(client, "communication_archive_room", { p_room_id: roomId, p_expected_version: expectedVersion });
}

export async function inviteToRoom(client: AnyClient, roomId: string, inviteeIds: string[]) {
  return callRpc(client, "communication_invite_to_room", { p_room_id: roomId, p_invitee_ids: inviteeIds });
}

export async function respondRoomInvite(client: AnyClient, inviteId: string, accept: boolean) {
  return callRpc(client, "communication_respond_room_invite", { p_invite_id: inviteId, p_accept: accept });
}

export async function removeMember(client: AnyClient, roomId: string, userId: string) {
  return callRpc(client, "communication_remove_member", { p_room_id: roomId, p_user_id: userId });
}

export async function patchMemberRole(client: AnyClient, roomId: string, userId: string, role: string) {
  return callRpc(client, "communication_patch_member_role", { p_room_id: roomId, p_user_id: userId, p_role: role });
}

export async function transferRoom(client: AnyClient, roomId: string, newOwnerId: string) {
  return callRpc(client, "communication_transfer_room", { p_room_id: roomId, p_new_owner: newOwnerId });
}

export async function listRoomInvites(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from("communication_room_invites")
    .select("id,room_id,inviter_id,state,expires_at")
    .eq("invitee_id", userId)
    .eq("state", "pending");
  if (error) throw new CommunicationError("ACTION_DENIED", error.message, true);
  const invites = (data || []) as Record<string, unknown>[];
  const rooms = ((await client.from("communication_rooms").select("id,name")).data || []) as Record<string, unknown>[];
  const people = ((await client.from("profiles").select("id,first_name,last_name")).data || []) as Record<string, unknown>[];
  return invites.map((invite) => {
    const room = rooms.find((item) => item.id === invite.room_id);
    const from = people.find((item) => item.id === invite.inviter_id);
    return {
      id: String(invite.id),
      roomId: String(invite.room_id),
      name: String(room?.name || "Sala"),
      from: [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Colega",
      expiresAt: String(invite.expires_at),
    };
  });
}
