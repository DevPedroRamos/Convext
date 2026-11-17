"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CallStage } from "@/components/communication/call-stage";
import { PrejoinPanel } from "@/components/communication/prejoin-panel";
import { useCommunication } from "@/components/communication/communication-provider";
import { communicationApi } from "@/lib/communication/api";
import type { RoomRecord } from "@/types/communication";

export default function RoomSessionPage() {
  const params = useParams<{ roomId: string }>();
  const { state, join } = useCommunication();
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    communicationApi.room(params.roomId).then((result) => setRoom(result.room)).catch(() => setMissing(true));
  }, [params.roomId]);

  if (missing) {
    return <p className="text-sm text-muted-foreground">Sala indisponível.</p>;
  }
  if (!room) return <p className="text-sm text-muted-foreground">Carregando sala...</p>;
  if (state === "connected" && join?.roomId === room.id) return <CallStage />;
  return <PrejoinPanel title={room.name} access={room.access} roomId={room.id} />;
}
