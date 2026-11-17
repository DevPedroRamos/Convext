import type { RoomAccess, RoomMemberRole } from "@/types/communication";

export type RoomVisibilityInput = {
  access: RoomAccess;
  archivedAt: string | null;
  isMember: boolean;
  hasPendingInvite: boolean;
  onboarded: boolean;
};

export function canSeeRoom(input: RoomVisibilityInput) {
  if (!input.onboarded || input.archivedAt) return false;
  if (input.access === "open") return true;
  return input.isMember || input.hasPendingInvite;
}

export function canEnterRoom(input: RoomVisibilityInput) {
  if (!input.onboarded || input.archivedAt) return false;
  if (input.access === "open") return true;
  return input.isMember;
}

export function canModerateRoom(role: RoomMemberRole | null) {
  return role === "owner" || role === "moderator";
}

export function canManageRoom(role: RoomMemberRole | null) {
  return role === "owner";
}

export function globalAdminMayArchiveWithoutListing(isAdmin: boolean, canSee: boolean) {
  return isAdmin || canSee;
}
