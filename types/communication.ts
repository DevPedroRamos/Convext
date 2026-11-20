export type RoomAccess = "open" | "private";
export type RoomMemberRole = "owner" | "moderator" | "member";
export type SessionKind = "room" | "direct";
export type SessionState = "waiting" | "active" | "ending" | "ended";
export type ParticipationState = "reserved" | "joined" | "reconnecting" | "left" | "removed";
export type ConnectionState = "idle" | "prejoin" | "joining" | "connected" | "reconnecting" | "failed" | "ended" | "leaving";
export type MediaSourceState = "off" | "requesting" | "on" | "denied" | "unavailable" | "failed" | "selecting";
export type CommunicationErrorCode =
  | "AUTH_REQUIRED"
  | "ACTION_DENIED"
  | "ROOM_UNAVAILABLE"
  | "SESSION_CONFLICT"
  | "ROOM_FULL"
  | "ROOM_LOCKED"
  | "PRESENTATION_BUSY"
  | "INVITE_EXPIRED"
  | "VERSION_CONFLICT"
  | "RATE_LIMITED"
  | "MEDIA_UNAVAILABLE"
  | "INVALID_INPUT";

export type CommunicationErrorBody = {
  code: CommunicationErrorCode;
  message: string;
  retryable: boolean;
  requestId: string;
};

export type RoomRecord = {
  id: string;
  name: string;
  description: string | null;
  access: RoomAccess;
  ownerId: string;
  lockedAt: string | null;
  archivedAt: string | null;
  version: number;
  createdAt: string;
  participantCount: number;
  live: boolean;
  memberRole: RoomMemberRole | null;
  participantAvatars: { id: string; name: string; avatarUrl: string | null }[];
};

export type DirectoryPerson = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  available: boolean;
  lastSeenAt: string | null;
  inCall: boolean;
};

export type JoinResult = {
  serverUrl: string;
  token: string;
  sessionId: string;
  participationId: string;
  generation: number;
  providerRoomName: string;
  kind: SessionKind;
  roomId: string | null;
  capabilities: { microphone: boolean; camera: boolean; screen: boolean };
  expiresAt: string;
};

export type NotificationRecord = {
  id: string;
  kind: string;
  referenceId: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};
