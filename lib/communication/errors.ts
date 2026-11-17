import { NextResponse } from "next/server";
import type { CommunicationErrorBody, CommunicationErrorCode } from "@/types/communication";

const statusByCode: Record<CommunicationErrorCode, number> = {
  AUTH_REQUIRED: 401,
  ACTION_DENIED: 403,
  ROOM_UNAVAILABLE: 404,
  SESSION_CONFLICT: 409,
  ROOM_FULL: 409,
  ROOM_LOCKED: 409,
  PRESENTATION_BUSY: 409,
  INVITE_EXPIRED: 409,
  VERSION_CONFLICT: 409,
  RATE_LIMITED: 429,
  MEDIA_UNAVAILABLE: 503,
  INVALID_INPUT: 400,
};

export class CommunicationError extends Error {
  constructor(
    public code: CommunicationErrorCode,
    message: string,
    public retryable = false,
  ) {
    super(message);
    this.name = "CommunicationError";
  }
}

export function requestIdFrom(request: Request) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

export function errorBody(code: CommunicationErrorCode, message: string, requestId: string, retryable = false): CommunicationErrorBody {
  return { code, message, retryable, requestId };
}

export function jsonError(code: CommunicationErrorCode, message: string, requestId: string, retryable = false) {
  return NextResponse.json(errorBody(code, message, requestId, retryable), {
    status: statusByCode[code],
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fromUnknown(error: unknown, requestId: string) {
  if (error instanceof CommunicationError) {
    return jsonError(error.code, error.message, requestId, error.retryable);
  }
  return jsonError("ACTION_DENIED", "Não foi possível concluir a operação.", requestId, true);
}
