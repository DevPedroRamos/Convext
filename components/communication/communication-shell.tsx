"use client";

import { ActiveCallDock } from "@/components/communication/active-call-dock";
import { CallAudioRenderer, CommunicationProvider } from "@/components/communication/communication-provider";
import { IncomingCallLayer } from "@/components/communication/incoming-call-layer";

export function CommunicationShell({ children }: { children: React.ReactNode }) {
  return (
    <CommunicationProvider>
      {children}
      <CallAudioRenderer />
      <IncomingCallLayer />
      <ActiveCallDock />
    </CommunicationProvider>
  );
}
