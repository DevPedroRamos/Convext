"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="max-w-md"><p className="label text-primary">Erro</p><h1 className="mt-4 font-display text-h1">Algo saiu do fluxo.</h1><p className="mt-4 text-muted-foreground">{error.message}</p><Button onClick={reset} className="mt-8 bg-primary text-primary-foreground">Tentar novamente</Button></div>
    </main>
  );
}
