import { describe, expect, it } from "vitest";
import { collectRemoteAudioTracks } from "@/lib/communication/audio-tracks";

describe("faixas de áudio remoto", () => {
  it("reproduz microfone e áudio da apresentação sem incluir faixas locais ou duplicadas", () => {
    const microphone = { sid: "mic-1" };
    const screenAudio = { sid: "screen-1" };

    expect(collectRemoteAudioTracks([
      { identity: "local:1", isLocal: true, microphoneTrack: microphone, screenAudio },
      { identity: "remote:1", microphoneTrack: microphone, screenAudio },
      { identity: "remote:2", microphoneTrack: microphone, screenAudio: null },
    ])).toEqual([
      { key: "remote:1:microphone", track: microphone },
      { key: "remote:1:screen", track: screenAudio },
    ]);
  });
});
