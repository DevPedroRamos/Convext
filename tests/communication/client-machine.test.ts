import { describe, expect, it } from "vitest";
import {
  leaveIsIdempotent,
  navigationKeepsSession,
  nextConnectionState,
  retryIdempotent,
  shouldRepublish,
  sourcesAfterReconnect,
} from "@/lib/communication/client-machine";

describe("máquina de conexão", () => {
  it("entra, conecta e sai sem criar outro ciclo sozinha", () => {
    let state = nextConnectionState("idle", "open_prejoin");
    state = nextConnectionState(state, "join");
    state = nextConnectionState(state, "connected");
    expect(state).toBe("connected");
    expect(navigationKeepsSession("/app/demandas")).toBe(true);
    state = nextConnectionState(state, "leave");
    expect(state).toBe("leaving");
    expect(leaveIsIdempotent("leaving")).toBe(true);
    expect(leaveIsIdempotent("idle")).toBe(true);
  });

  it("na reconexão não religa câmera nem tela que estavam desligadas", () => {
    const previous = { microphone: "on", camera: "off", screen: "off" } as const;
    const next = sourcesAfterReconnect(previous);
    expect(next.microphone).toBe("on");
    expect(next.camera).toBe("off");
    expect(next.screen).toBe("off");
    expect(shouldRepublish("camera", previous)).toBe(false);
    expect(shouldRepublish("screen", previous)).toBe(false);
    expect(shouldRepublish("microphone", previous)).toBe(true);
  });

  it("repete uma saída idempotente antes de informar falha", async () => {
    let attempts = 0;
    await expect(retryIdempotent(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("rede indisponível");
    }, 2)).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });
});
