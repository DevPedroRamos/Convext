"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { ClientRecord } from "@/lib/clients";

export function ClientSuggest({
  clients,
  value,
  onChange,
  disabled = false,
}: {
  clients: ClientRecord[];
  value: ClientRecord | null;
  onChange: (client: ClientRecord | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = term
      ? clients.filter((client) => {
          const haystack = [client.name, client.whatsapp, client.company].filter(Boolean).join(" ").toLowerCase();
          return haystack.includes(term);
        })
      : clients;
    return list.slice(0, 8);
  }, [clients, query]);

  return (
    <div className="relative">
      <Input
        value={value && !open ? `${value.name} · ${value.company}` : query}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          if (value) onChange(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Buscar por nome, número ou empresa"
      />
      {open && !disabled ? (
        <div className="mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {matches.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            matches.map((client) => (
              <button
                key={client.id}
                type="button"
                className="grid w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(client);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="font-medium">{client.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[client.company, client.whatsapp].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
