import type { Metadata } from "next";
import { ImplementationSpecPage } from "@/components/communication/implementation-spec-page";

export const metadata: Metadata = { title: "Spec de comunicação" };

export default function CommunicationSpecPage() {
  return <ImplementationSpecPage />;
}
