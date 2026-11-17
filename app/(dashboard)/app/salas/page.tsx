import type { Metadata } from "next";
import { CommunicationPrototype } from "@/components/communication/communication-prototype";

export const metadata: Metadata = { title: "Salas — Protótipo" };

export default function SalasPrototypePage() {
  return <CommunicationPrototype />;
}
