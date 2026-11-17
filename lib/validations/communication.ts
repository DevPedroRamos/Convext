import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional().nullable(),
  access: z.enum(["open", "private"]),
  inviteeIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateRoomSchema = z.object({
  expectedVersion: z.number().int(),
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(240).optional().nullable(),
  access: z.enum(["open", "private"]).optional(),
  locked: z.boolean().optional(),
});

export const archiveRoomSchema = z.object({
  expectedVersion: z.number().int(),
});

export const inviteesSchema = z.object({
  inviteeIds: z.array(z.string().uuid()).min(1),
});

export const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export const memberRoleSchema = z.object({
  role: z.enum(["moderator", "member"]),
});

export const transferSchema = z.object({
  newOwnerId: z.string().uuid(),
});

export const joinSchema = z.object({
  roomId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  deviceSessionId: z.string().min(8).max(120),
  operationId: z.string().min(8).max(120),
}).refine((value) => Boolean(value.roomId || value.sessionId), {
  message: "Informe roomId ou sessionId.",
});

export const participationSchema = z.object({
  participationId: z.string().uuid(),
  generation: z.number().int().positive(),
});

export const takeoverSchema = z.object({
  roomId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  deviceSessionId: z.string().min(8).max(120),
});

export const moderationSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(["remove", "deny-source", "allow-source"]),
  source: z.enum(["microphone", "camera", "screen"]).optional(),
});

export const endSessionSchema = z.object({
  expectedVersion: z.number().int(),
});

export const publicationSourceSchema = z.enum(["camera", "screen"]);
