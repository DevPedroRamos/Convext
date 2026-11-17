"use client";

import { useParams } from "next/navigation";
import { CallStage } from "@/components/communication/call-stage";
import { PrejoinPanel } from "@/components/communication/prejoin-panel";
import { useCommunication } from "@/components/communication/communication-provider";

export default function DirectCallPage() {
  const params = useParams<{ sessionId: string }>();
  const { state, join } = useCommunication();
  if (state === "connected" && join?.sessionId === params.sessionId) return <CallStage />;
  return <PrejoinPanel title="Chamada" sessionId={params.sessionId} hrefBack="/app/salas" />;
}
