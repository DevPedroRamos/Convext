"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Headphones, LockKeyhole, PhoneCall, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresenceSignals } from "@/components/dashboard/presence-runtime";
import { communicationApi } from "@/lib/communication/api";
import { isOnline, presenceLabel } from "@/lib/presence";
import { cn } from "@/lib/utils";
import type { DirectoryPerson, RoomRecord } from "@/types/communication";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CV";
}

function CreateRoomDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      await communicationApi.createRoom({ name, description, access: privateRoom ? "private" : "open", inviteeIds: [] });
      toast.success("Sala criada. Entre quando quiser.");
      setOpen(false);
      setName("");
      setDescription("");
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a sala.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg"><Plus /> Criar sala</Button>
      </SheetTrigger>
      <SheetContent size="panel">
        <SheetHeader>
          <SheetTitle>Criar uma sala</SheetTitle>
          <SheetDescription>Salas privadas restringem o acesso a membros convidados. Isso não é criptografia ponta a ponta.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 py-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Nome</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Nome da sala" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Descrição</span>
            <Input value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Descrição da sala" />
          </label>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Acesso</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setPrivateRoom(false)} className={cn("rounded-xl px-4 py-3 text-left text-sm ring-1", !privateRoom ? "bg-secondary ring-primary" : "ring-border")}>Aberta à equipe</button>
              <button type="button" onClick={() => setPrivateRoom(true)} className={cn("rounded-xl px-4 py-3 text-left text-sm ring-1", privateRoom ? "bg-secondary ring-primary" : "ring-border")}>Privada por convite</button>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-0 flex-row justify-end p-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || name.trim().length < 2}>{pending ? "Criando..." : "Criar"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function RoomDirectory() {
  const [query, setQuery] = useState("");
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [invites, setInvites] = useState<{ id: string; roomId: string; name: string; from: string; expiresAt: string }[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  async function load() {
    try {
      const [roomData, peopleData, inviteData] = await Promise.all([
        communicationApi.rooms(query),
        communicationApi.people(),
        communicationApi.invites(),
      ]);
      setRooms(roomData.rooms);
      setPeople(peopleData.people);
      setInvites(inviteData.invites);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as salas.");
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  const filteredPeople = useMemo(
    () => people.filter((person) => `${person.firstName} ${person.lastName}`.toLowerCase().includes(query.toLowerCase())),
    [people, query],
  );

  return (
    <div className="grid gap-7">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="max-w-xl font-display text-4xl tracking-[-0.04em] sm:text-5xl">Onde a equipe se encontra.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Salas persistentes, chamadas diretas e apresentações sem sair da operação. Sala privada significa acesso restrito, não criptografia ponta a ponta.</p>
        </div>
        <CreateRoomDialog onCreated={() => void load()} />
      </header>
      <Tabs defaultValue="rooms" className="gap-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <TabsList variant="line" className="h-10 justify-start">
            <TabsTrigger value="rooms" className="px-3">Salas</TabsTrigger>
            <TabsTrigger value="people" className="px-3">Pessoas</TabsTrigger>
            <TabsTrigger value="invites" className="px-3">Convites {invites.length ? <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{invites.length}</span> : null}</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar sala ou pessoa" />
          </div>
        </div>
        <TabsContent value="rooms" className="grid gap-3">
          {rooms.map((room, index) => (
            <article key={room.id} className={cn("group grid gap-5 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:bg-secondary/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center", index === 0 && "bg-[radial-gradient(circle_at_12%_50%,rgba(243,87,3,.13),transparent_28%)]")}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl tracking-[-0.03em]">{room.name}</h3>
                  {room.live ? <Badge variant="secondary" className="gap-1"><span className="size-1.5 rounded-full bg-emerald-400" /> Ao vivo</Badge> : null}
                  {room.lockedAt ? <Badge variant="outline">Novas entradas bloqueadas</Badge> : null}
                </div>
                {room.description ? <p className="mt-2 max-w-xl text-sm text-muted-foreground">{room.description}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{room.access === "private" ? <LockKeyhole className="size-3.5" /> : <Users className="size-3.5" />}{room.access === "private" ? "Privada por convite" : "Aberta à equipe"}</span>
                  <span className="text-xs text-muted-foreground">{room.participantCount ? `${room.participantCount} pessoas conversando` : "Sala vazia"}</span>
                  {room.participantAvatars.length ? (
                    <AvatarGroup>
                      {room.participantAvatars.map((person) => (
                        <Avatar key={person.id}><AvatarImage src={person.avatarUrl || undefined} /><AvatarFallback>{initials(person.name)}</AvatarFallback></Avatar>
                      ))}
                    </AvatarGroup>
                  ) : null}
                </div>
              </div>
              <Button asChild variant={index === 0 ? "default" : "outline"} size="lg" disabled={Boolean(room.lockedAt)}>
                <Link href={`/app/salas/${room.id}`}><Headphones /> {room.live ? "Ver e entrar" : "Abrir sala"}</Link>
              </Button>
            </article>
          ))}
          {!rooms.length ? (
            <div className="rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-border">
              <p className="font-medium">{query ? "Nenhuma sala encontrada" : "Ainda não há salas"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{query ? "Tente buscar por outro nome ou limpe o campo." : "Crie a primeira sala para a equipe."}</p>
              {query ? <Button variant="outline" className="mt-5" onClick={() => setQuery("")}>Limpar busca</Button> : null}
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value="people" className="grid gap-3">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3">
            <p className="text-sm text-muted-foreground">Selecione colegas para iniciar uma chamada direta.</p>
            <Button disabled={!selectedPeople.length} onClick={async () => {
              try {
                const created = await communicationApi.call(selectedPeople);
                window.location.href = `/app/chamadas/${created.session.id}`;
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Não foi possível chamar.");
              }
            }}><PhoneCall /> Chamar {selectedPeople.length || ""}</Button>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {filteredPeople.map((person) => (
              <DirectoryPersonRow
                key={person.id}
                person={person}
                selected={selectedPeople.includes(person.id)}
                onToggle={() => setSelectedPeople((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="invites" className="grid gap-3">
          {invites.map((invite) => (
            <article key={invite.id} className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border sm:flex-row sm:items-center">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary"><LockKeyhole className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{invite.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Convite de {invite.from}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => { await communicationApi.respondRoomInvite(invite.id, "decline"); void load(); }}>Recusar</Button>
                <Button onClick={async () => { await communicationApi.respondRoomInvite(invite.id, "accept"); window.location.href = `/app/salas/${invite.roomId}`; }}>Aceitar</Button>
              </div>
            </article>
          ))}
          {!invites.length ? <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DirectoryPersonRow({
  person,
  selected,
  onToggle,
}: {
  person: DirectoryPerson;
  selected: boolean;
  onToggle: () => void;
}) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ") || "Colega";
  const live = usePresenceSignals(person.id, { available: person.available, lastSeenAt: person.lastSeenAt });
  const online = isOnline(live);
  return (
    <button type="button" aria-pressed={selected} onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <span className="relative">
        <Avatar size="lg"><AvatarImage src={person.avatarUrl || undefined} /><AvatarFallback>{initials(name)}</AvatarFallback></Avatar>
        <span aria-hidden className={cn("absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-card", online ? "bg-emerald-400" : "bg-zinc-500")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="block truncate text-sm text-muted-foreground">{presenceLabel(live)}{person.inCall ? " · Em chamada" : ""}</span>
      </span>
      <span className={cn("grid size-7 place-items-center rounded-full ring-1", selected ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border")}>{selected ? <Check className="size-4" /> : null}</span>
    </button>
  );
}
