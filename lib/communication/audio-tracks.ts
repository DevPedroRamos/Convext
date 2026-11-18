export type AudioParticipant<T> = {
  identity: string;
  isLocal?: boolean;
  microphoneTrack?: T | null;
  screenAudio?: T | null;
};

export type RemoteAudioEntry<T> = {
  key: string;
  track: T;
};

export function collectRemoteAudioTracks<T>(participants: AudioParticipant<T>[]): RemoteAudioEntry<T>[] {
  const seen = new Set<T>();
  const tracks: RemoteAudioEntry<T>[] = [];

  for (const participant of participants) {
    if (participant.isLocal) continue;
    for (const [source, track] of [
      ["microphone", participant.microphoneTrack],
      ["screen", participant.screenAudio],
    ] as const) {
      if (!track || seen.has(track)) continue;
      seen.add(track);
      tracks.push({ key: `${participant.identity}:${source}`, track });
    }
  }

  return tracks;
}
