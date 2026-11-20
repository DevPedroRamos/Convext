export type MediaSourceName = "microphone" | "camera" | "screen";
export type LiveKitSourceName = "microphone" | "camera" | "screen_share" | "screen_share_audio";

export function sourcesForJoin(canMicrophone: boolean): MediaSourceName[] {
  return canMicrophone ? ["microphone"] : [];
}

export function sourcesForReserve(source: "camera" | "screen"): MediaSourceName[] {
  return source === "screen" ? ["microphone", "camera", "screen"] : ["microphone", "camera"];
}

export function expandLiveKitSourceNames(sources: MediaSourceName[]): LiveKitSourceName[] {
  const mapped: LiveKitSourceName[] = [];
  for (const source of sources) {
    if (source === "screen") {
      mapped.push("screen_share", "screen_share_audio");
      continue;
    }
    mapped.push(source);
  }
  return mapped;
}

export function captureOnJoin(input: { listenOnly?: boolean; microphone?: boolean; camera?: boolean }) {
  if (input.listenOnly) return { microphone: false, camera: false };
  return { microphone: Boolean(input.microphone), camera: Boolean(input.camera) };
}
