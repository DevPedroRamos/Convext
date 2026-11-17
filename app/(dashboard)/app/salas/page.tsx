import type { Metadata } from "next";
import { RoomDirectory } from "@/components/communication/room-directory";

export const metadata: Metadata = { title: "Salas" };

export default function SalasPage() {
  return <RoomDirectory />;
}
