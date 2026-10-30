"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ClientDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Excluir ${name}?`)) return;
    setLoading(true);
    const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível excluir.");
      return;
    }
    toast.success("Cliente excluído.");
    router.push("/app/clientes");
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : null}
      Excluir
    </Button>
  );
}
