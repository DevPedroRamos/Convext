"use client";

import { useRouter } from "next/navigation";
import { CircleOff, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { clearPresencePrompt, shouldPromptPresence } from "@/lib/presence-session";
import { cn } from "@/lib/utils";

export function PresencePrompt() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shouldPromptPresence()) setOpen(true);
  }, []);

  async function confirm() {
    setLoading(true);
    const response = await fetch("/api/me/presence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: online }),
    });
    setLoading(false);
    if (!response.ok) {
      toast.error("Não foi possível salvar a presença.");
      return;
    }
    clearPresencePrompt();
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={() => {}}>
      <SheetContent
        size="panel"
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Ficar online?</SheetTitle>
          <SheetDescription>O time te vê como ausente até você confirmar.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOnline(true)}
            className={cn(
              "grid gap-2 rounded-xl border px-4 py-5 text-left transition",
              online ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
            )}
          >
            <Radio className={cn("size-5", online && "text-emerald-400")} />
            <span className="text-sm font-medium text-foreground">Disponível</span>
          </button>
          <button
            type="button"
            onClick={() => setOnline(false)}
            className={cn(
              "grid gap-2 rounded-xl border px-4 py-5 text-left transition",
              !online ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
            )}
          >
            <CircleOff className="size-5" />
            <span className="text-sm font-medium text-foreground">Ausente</span>
          </button>
        </div>
        <Button type="button" disabled={loading} onClick={confirm} className="w-full">
          Confirmar
        </Button>
      </SheetContent>
    </Sheet>
  );
}
