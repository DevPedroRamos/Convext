const STORAGE_KEY = "convext:media-devices";

export type StoredMediaDevices = {
  audioInput?: string;
  videoInput?: string;
  permissionGranted?: boolean;
};

export function loadMediaDevices(): StoredMediaDevices {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredMediaDevices;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMediaDevices(partial: StoredMediaDevices) {
  if (typeof window === "undefined") return;
  const next = { ...loadMediaDevices(), ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function persistTracks(stream: MediaStream) {
  const audio = stream.getAudioTracks()[0]?.getSettings().deviceId;
  const video = stream.getVideoTracks()[0]?.getSettings().deviceId;
  saveMediaDevices({
    permissionGranted: true,
    ...(audio ? { audioInput: audio } : {}),
    ...(video ? { videoInput: video } : {}),
  });
}

export function audioConstraints() {
  const stored = loadMediaDevices();
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(stored.audioInput ? { deviceId: { ideal: stored.audioInput } } : {}),
  } satisfies MediaTrackConstraints;
}

export function videoConstraints() {
  const stored = loadMediaDevices();
  return {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    ...(stored.videoInput ? { deviceId: { ideal: stored.videoInput } } : {}),
  } satisfies MediaTrackConstraints;
}

export async function queryMediaPermission(name: "camera" | "microphone") {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "prompt";
  try {
    const status = await navigator.permissions.query({ name } as PermissionDescriptor);
    return status.state;
  } catch {
    return loadMediaDevices().permissionGranted ? "granted" : "prompt";
  }
}
