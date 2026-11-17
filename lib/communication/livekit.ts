import { AccessToken, RoomServiceClient, TrackSource, WebhookReceiver } from "livekit-server-sdk";
import { hasLiveKitConfig, liveKitConfig, communicationLimits } from "@/lib/communication/config";
import { CommunicationError } from "@/lib/communication/errors";

export type TokenGrants = {
  identity: string;
  roomName: string;
  canPublish: boolean;
  sources: Array<"microphone" | "camera" | "screen">;
};

const sourceMap = {
  microphone: TrackSource.MICROPHONE,
  camera: TrackSource.CAMERA,
  screen: TrackSource.SCREEN_SHARE,
};

export function requireLiveKit() {
  if (!hasLiveKitConfig()) {
    throw new CommunicationError("MEDIA_UNAVAILABLE", "O serviço de mídia não está disponível.", true);
  }
  return liveKitConfig();
}

export async function createMediaToken(grants: TokenGrants) {
  const config = requireLiveKit();
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: grants.identity,
    ttl: communicationLimits.tokenTtlSeconds,
  });
  token.addGrant({
    roomJoin: true,
    room: grants.roomName,
    canSubscribe: true,
    canPublish: grants.canPublish,
    canPublishData: true,
    canPublishSources: grants.sources.map((source) => sourceMap[source]),
  });
  const jwt = await token.toJwt();
  const expiresAt = new Date(Date.now() + communicationLimits.tokenTtlSeconds * 1000).toISOString();
  return { serverUrl: config.url, token: jwt, expiresAt };
}

function roomClient() {
  const config = requireLiveKit();
  return new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
}

export async function removeProviderParticipant(roomName: string, identity: string) {
  try {
    await roomClient().removeParticipant(roomName, identity);
  } catch {
    // reconciliação trata ausência
  }
}

export async function endProviderRoom(roomName: string) {
  try {
    await roomClient().deleteRoom(roomName);
  } catch {
    // sala já encerrada
  }
}

export async function mutePublishedTrack(roomName: string, identity: string, source: string) {
  try {
    const participant = await roomClient().getParticipant(roomName, identity);
    const track = participant.tracks.find((item) => {
      if (source === "microphone") return item.source === TrackSource.MICROPHONE;
      if (source === "camera") return item.source === TrackSource.CAMERA;
      return item.source === TrackSource.SCREEN_SHARE || item.source === TrackSource.SCREEN_SHARE_AUDIO;
    });
    if (track?.sid) await roomClient().mutePublishedTrack(roomName, identity, track.sid, true);
  } catch {
    // retry via outbox
  }
}

export async function verifyLiveKitWebhook(rawBody: string, authorization: string | null) {
  const config = requireLiveKit();
  const receiver = new WebhookReceiver(config.apiKey, config.apiSecret);
  return receiver.receive(rawBody, authorization || undefined, true);
}
