export const communicationLimits = {
  maxParticipants: 12,
  maxCameras: 6,
  maxScreens: 1,
  ringSeconds: 30,
  reserveSeconds: 30,
  reconnectSeconds: 30,
  emptyEndSeconds: 60,
  screenReserveSeconds: 15,
  roomInviteHours: 24,
  tokenTtlSeconds: 60,
};

export function admissionEnabled() {
  return process.env.COMMUNICATION_ADMISSION_ENABLED !== "false";
}

export function hasLiveKitConfig() {
  return Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}

export function liveKitConfig() {
  return {
    url: process.env.LIVEKIT_URL || "",
    apiKey: process.env.LIVEKIT_API_KEY || "",
    apiSecret: process.env.LIVEKIT_API_SECRET || "",
  };
}

export function reconcileSecret() {
  return process.env.COMMUNICATION_RECONCILE_SECRET || process.env.LIVEKIT_API_SECRET || "";
}

export function appOrigin() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080";
  try {
    return new URL(url).origin;
  } catch {
    return "http://localhost:8080";
  }
}
