"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  FileText,
  Headphones,
  LockKeyhole,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneCall,
  PhoneOff,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type View = "directory" | "prejoin" | "call";

type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  available: boolean;
  status?: string;
};

type Room = {
  id: string;
  name: string;
  description: string;
  access: "open" | "private";
  participants: Person[];
  live: boolean;
};

const people: Person[] = [
  { id: "ana", name: "Ana Martins", initials: "AM", role: "Direção de arte", available: true, status: "Em chamada" },
  { id: "bruno", name: "Bruno Lima", initials: "BL", role: "Social media", available: true, status: "Modo foco" },
  { id: "clara", name: "Clara Nunes", initials: "CN", role: "Atendimento", available: true },
  { id: "diego", name: "Diego Alves", initials: "DA", role: "Motion designer", available: false },
  { id: "eu", name: "Você", initials: "PR", role: "Tech lead", available: true },
];

const rooms: Room[] = [
  {
    id: "geral",
    name: "Geral",
    description: "Ponto de encontro rápido para toda a equipe.",
    access: "open",
    participants: [people[0], people[2], people[4]],
    live: true,
  },
  {
    id: "revisao",
    name: "Revisão criativa",
    description: "Aprovação de peças, roteiros e direção visual.",
    access: "private",
    participants: [people[0], people[3]],
    live: true,
  },
  {
    id: "planejamento",
    name: "Planejamento semanal",
    description: "Prioridades da operação e distribuição de demandas.",
    access: "open",
    participants: [],
    live: false,
  },
];

function PersonAvatar({ person, size = "default" }: { person: Person; size?: "default" | "lg" }) {
  return (
    <Avatar size={size} className={cn(size === "lg" && "size-12")}>
      <AvatarFallback className="bg-secondary text-foreground">{person.initials}</AvatarFallback>
    </Avatar>
  );
}

function RoomAccess({ access }: Pick<Room, "access">) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {access === "private" ? <LockKeyhole className="size-3.5" /> : <Users className="size-3.5" />}
      {access === "private" ? "Privada por convite" : "Aberta à equipe"}
    </span>
  );
}

function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [privateRoom, setPrivateRoom] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg"><Plus /> Criar sala</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar uma sala</DialogTitle>
          <DialogDescription>O protótipo demonstra o fluxo; nenhuma sala será salva.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Nome</span>
            <Input defaultValue="Daily de criação" aria-label="Nome da sala" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Descrição</span>
            <Input defaultValue="Alinhamento rápido antes de começar o dia." aria-label="Descrição da sala" />
          </label>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Acesso</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={!privateRoom}
                onClick={() => setPrivateRoom(false)}
                className={cn("rounded-xl bg-secondary p-4 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", !privateRoom ? "ring-primary" : "ring-border hover:bg-muted")}
              >
                <Users className="mb-3 size-5" />
                <span className="block font-medium">Aberta à equipe</span>
                <span className="mt-1 block text-xs text-muted-foreground">Qualquer membro pode entrar.</span>
              </button>
              <button
                type="button"
                aria-pressed={privateRoom}
                onClick={() => setPrivateRoom(true)}
                className={cn("rounded-xl bg-secondary p-4 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", privateRoom ? "ring-primary" : "ring-border hover:bg-muted")}
              >
                <LockKeyhole className="mb-3 size-5" />
                <span className="block font-medium">Privada</span>
                <span className="mt-1 block text-xs text-muted-foreground">Somente pessoas convidadas.</span>
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => { setOpen(false); toast.success("Sala simulada criada", { description: "Nenhum dado foi persistido neste protótipo." }); }}>Criar sala</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Directory({ onJoin }: { onJoin: (room: Room) => void }) {
  const [query, setQuery] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const filteredRooms = useMemo(
    () => rooms.filter((room) => `${room.name} ${room.description}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  function togglePerson(id: string) {
    setSelectedPeople((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <Tabs defaultValue="rooms" className="gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <TabsList variant="line" className="h-10 justify-start">
          <TabsTrigger value="rooms" className="px-3">Salas</TabsTrigger>
          <TabsTrigger value="people" className="px-3">Pessoas</TabsTrigger>
          <TabsTrigger value="invites" className="px-3">Convites <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">2</span></TabsTrigger>
        </TabsList>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar neste protótipo" />
        </div>
      </div>

      <TabsContent value="rooms" className="grid gap-3">
        {filteredRooms.map((room, index) => (
          <article
            key={room.id}
            className={cn(
              "group grid gap-5 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:bg-secondary/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
              index === 0 && "bg-[radial-gradient(circle_at_12%_50%,rgba(243,87,3,.13),transparent_28%)]"
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl tracking-[-0.03em]">{room.name}</h3>
                {room.live ? <Badge variant="secondary" className="gap-1"><span className="size-1.5 rounded-full bg-emerald-400" /> Ao vivo</Badge> : null}
              </div>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{room.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                <RoomAccess access={room.access} />
                <span className="text-xs text-muted-foreground">{room.participants.length ? `${room.participants.length} pessoas conversando` : "Sala vazia"}</span>
                {room.participants.length ? (
                  <AvatarGroup>
                    {room.participants.map((person) => <PersonAvatar key={person.id} person={person} />)}
                  </AvatarGroup>
                ) : null}
              </div>
            </div>
            <Button variant={index === 0 ? "default" : "outline"} size="lg" onClick={() => onJoin(room)}>
              <Headphones /> {room.live ? "Ver e entrar" : "Abrir sala"}
            </Button>
          </article>
        ))}
        {!filteredRooms.length ? (
          <div className="rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-border">
            <p className="font-medium">Nenhuma sala encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente buscar por outro nome ou limpe o campo.</p>
            <Button variant="outline" className="mt-5" onClick={() => setQuery("")}>Limpar busca</Button>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="people" className="grid gap-3">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3">
          <p className="text-sm text-muted-foreground">Selecione colegas para iniciar uma chamada direta.</p>
          <Button disabled={!selectedPeople.length} onClick={() => toast("Chamada simulada iniciada", { description: `${selectedPeople.length} pessoa(s) receberiam o convite.` })}>
            <PhoneCall /> Chamar {selectedPeople.length || ""}
          </Button>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {people.filter((person) => person.id !== "eu" && person.name.toLowerCase().includes(query.toLowerCase())).map((person) => {
            const selected = selectedPeople.includes(person.id);
            return (
              <button key={person.id} type="button" aria-pressed={selected} onClick={() => togglePerson(person.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="relative">
                  <PersonAvatar person={person} size="lg" />
                  <span aria-hidden="true" className={cn("absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-card", person.available ? "bg-emerald-400" : "bg-zinc-500")} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{person.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{person.role} · {person.available ? "Disponível" : "Indisponível"}{person.status ? ` · ${person.status}` : ""}</span>
                </span>
                <span className={cn("grid size-7 place-items-center rounded-full ring-1", selected ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border")}>
                  {selected ? <Check className="size-4" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="invites" className="grid gap-3">
        {[{ name: "Revisão de campanha", from: "Ana Martins", time: "Expira em 8h" }, { name: "Alinhamento da entrega", from: "Clara Nunes", time: "Expira amanhã" }].map((invite) => (
          <article key={invite.name} className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border sm:flex-row sm:items-center">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary"><LockKeyhole className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium">{invite.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Convite de {invite.from} · {invite.time}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast("Convite recusado na simulação", { description: invite.name })}>Recusar</Button>
              <Button onClick={() => toast.success("Convite aceito na simulação", { description: `A pré-entrada de ${invite.name} seria aberta.` })}>Aceitar</Button>
            </div>
          </article>
        ))}
      </TabsContent>
    </Tabs>
  );
}

function Prejoin({ room, onBack, onEnter }: { room: Room; onBack: () => void; onEnter: () => void }) {
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft /> Voltar</Button>
        <RoomAccess access={room.access} />
      </div>
      <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)] md:p-8">
        <div className="relative grid min-h-72 place-items-center overflow-hidden rounded-2xl bg-[#0a0a0a] ring-1 ring-border">
          {camera ? (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(243,87,3,.26),transparent_34%)]">
              <div className="text-center"><PersonAvatar person={people[4]} size="lg" /><p className="mt-3 font-medium">Preview ilustrativo</p></div>
            </div>
          ) : (
            <div className="text-center"><PersonAvatar person={people[4]} size="lg" /><p className="mt-4 text-sm text-muted-foreground">Sua câmera está desligada</p></div>
          )}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button size="icon-lg" variant={mic ? "secondary" : "destructive"} onClick={() => setMic((value) => !value)} aria-label={mic ? "Desligar microfone" : "Ligar microfone"} aria-pressed={mic}>{mic ? <Mic /> : <MicOff />}</Button>
            <Button size="icon-lg" variant={camera ? "secondary" : "destructive"} onClick={() => setCamera((value) => !value)} aria-label={camera ? "Desligar câmera" : "Ligar câmera"} aria-pressed={camera}>{camera ? <Camera /> : <CameraOff />}</Button>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm text-muted-foreground">Antes de entrar</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">{room.name}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Confira seus dispositivos. O preview é local e nada é transmitido neste protótipo.</p>
          <div className="mt-6 grid gap-2">
            <Button variant="outline" className="h-11 justify-between px-4" onClick={() => toast("Seletor de microfone simulado", { description: "A versão real listará os dispositivos autorizados pelo navegador." })}><span className="flex items-center gap-2"><Mic className="size-4" /> Microfone padrão</span><ChevronDown className="size-4" /></Button>
            <Button variant="outline" className="h-11 justify-between px-4" onClick={() => toast("Seletor de câmera simulado", { description: "A versão real listará os dispositivos autorizados pelo navegador." })}><span className="flex items-center gap-2"><Camera className="size-4" /> Câmera padrão</span><ChevronDown className="size-4" /></Button>
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <Button variant="outline" size="lg" onClick={() => { setMic(false); setCamera(false); onEnter(); }}>Entrar só para ouvir</Button>
            <Button size="lg" onClick={onEnter}>Entrar na sala</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ParticipantTile({ person, camera, speaking }: { person: Person; camera?: boolean; speaking?: boolean }) {
  return (
    <div className={cn("relative grid min-h-44 place-items-center overflow-hidden rounded-2xl bg-[#121212] ring-1 ring-border transition", speaking && "ring-2 ring-primary")}>
      {camera ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,.12),transparent_22%),linear-gradient(135deg,#242424,#101010)]" />
      ) : null}
      <div className="relative text-center"><PersonAvatar person={person} size="lg" /></div>
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="truncate rounded-md bg-black/70 px-2 py-1 text-xs text-white">{person.name}</span>
        {speaking ? <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">Falando</span> : <MicOff className="size-4 text-muted-foreground" />}
      </div>
    </div>
  );
}

function ActiveCall({ room, onLeave }: { room: Room; onLeave: () => void }) {
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [mobilePeopleOpen, setMobilePeopleOpen] = useState(false);
  const remoteParticipants = room.participants.filter((person) => person.id !== "eu");
  const participants = remoteParticipants.length ? remoteParticipants : [people[0], people[2]];

  return (
    <section className="overflow-hidden rounded-2xl bg-[#0a0a0a] ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" /><h2 className="truncate font-medium">{room.name}</h2></div>
          <p className="mt-0.5 text-xs text-muted-foreground">Conectado · 08:41 · demonstração</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            if (window.matchMedia("(min-width: 1280px)").matches) setPeopleOpen((value) => !value);
            else setMobilePeopleOpen(true);
          }}
          aria-label="Abrir painel de pessoas"
        ><Users /> Pessoas {participants.length + 1}</Button>
        <Button variant="ghost" size="icon" aria-label="Mais opções" onClick={() => toast("Mais opções", { description: "Gravação, layout e moderação entram nas próximas fases da implementação." })}><MoreHorizontal /></Button>
      </div>
      <div className={cn("grid min-h-[520px]", peopleOpen && "xl:grid-cols-[minmax(0,1fr)_280px]")}>
        <div className="flex min-w-0 flex-col p-3 sm:p-5">
          {sharing ? (
            <div className="flex flex-1 flex-col gap-3">
              <div className="relative grid min-h-80 flex-1 place-items-center overflow-hidden rounded-2xl bg-[#171717] ring-1 ring-border">
                <div className="absolute inset-5 rounded-xl bg-[#f5f5f2] p-5 text-[#171717]">
                  <div className="flex items-center justify-between border-b border-black/15 pb-3"><strong>Apresentação ilustrativa</strong><span className="text-xs">Convext</span></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_.9fr]"><div className="rounded-xl bg-[#111] p-5 text-white"><p className="text-2xl font-medium tracking-[-.03em]">Campanha em revisão</p><p className="mt-2 text-sm text-white/60">A tela compartilhada ocupa o palco principal.</p></div><div className="rounded-xl bg-[#f35703] p-5"><p className="text-sm font-medium">Feedback da equipe</p><div className="mt-8 h-2 w-3/4 rounded-full bg-black/20" /><div className="mt-3 h-2 w-1/2 rounded-full bg-black/20" /></div></div>
                </div>
                <div className="absolute left-4 top-4 rounded-lg bg-black/75 px-3 py-1.5 text-xs text-white">Você está apresentando</div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">{participants.slice(0, 4).map((person) => <div key={person.id} className="w-32 shrink-0"><ParticipantTile person={person} speaking={person.id === "ana"} /></div>)}</div>
            </div>
          ) : (
            <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
              {participants.map((person, index) => <ParticipantTile key={person.id} person={person} camera={index < 2} speaking={index === 0} />)}
              <ParticipantTile person={people[4]} camera={camera} />
            </div>
          )}
        </div>
        {peopleOpen ? (
          <aside className="hidden border-l border-border bg-card/60 p-4 xl:block">
            <div className="flex items-center justify-between"><h3 className="font-medium">Pessoas</h3><Button variant="ghost" size="icon-sm" onClick={() => setPeopleOpen(false)} aria-label="Fechar painel"><X /></Button></div>
            <div className="mt-5 grid gap-2">
              {[...participants, people[4]].map((person, index) => (
                <div key={person.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary"><PersonAvatar person={person} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{person.name}</p><p className="truncate text-xs text-muted-foreground">{index === 0 ? "Falando agora" : index === participants.length ? "Você" : "Ouvindo"}</p></div>{index === 0 ? <Volume2 className="size-4 text-primary" /> : <MicOff className="size-4 text-muted-foreground" />}</div>
              ))}
            </div>
            <Button variant="outline" className="mt-5 w-full" onClick={() => toast("Convite simulado", { description: "Na versão real, apenas membros da equipe poderão ser convidados." })}><Plus /> Convidar pessoas</Button>
          </aside>
        ) : null}
      </div>
      <Sheet open={mobilePeopleOpen} onOpenChange={setMobilePeopleOpen}>
        <SheetContent className="xl:hidden">
          <SheetHeader className="pt-6">
            <SheetTitle>Pessoas na sala</SheetTitle>
            <SheetDescription>{participants.length + 1} participantes nesta demonstração.</SheetDescription>
          </SheetHeader>
          <div className="mt-3 grid gap-2">
            {[...participants, people[4]].map((person, index) => (
              <div key={person.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3"><PersonAvatar person={person} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{person.name}</p><p className="truncate text-xs text-muted-foreground">{index === 0 ? "Falando agora" : index === participants.length ? "Você" : "Ouvindo"}</p></div>{index === 0 ? <Volume2 className="size-4 text-primary" /> : <MicOff className="size-4 text-muted-foreground" />}</div>
            ))}
          </div>
          <Button variant="outline" className="mt-2 w-full" onClick={() => toast("Convite simulado", { description: "Na versão real, apenas membros da equipe poderão ser convidados." })}><Plus /> Convidar pessoas</Button>
        </SheetContent>
      </Sheet>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border bg-card px-3 py-3 sm:gap-3">
        <Button size="icon-lg" variant={mic ? "secondary" : "destructive"} onClick={() => setMic((value) => !value)} aria-label={mic ? "Desligar microfone" : "Ligar microfone"} aria-pressed={mic}>{mic ? <Mic /> : <MicOff />}</Button>
        <Button size="icon-lg" variant={camera ? "secondary" : "destructive"} onClick={() => setCamera((value) => !value)} aria-label={camera ? "Desligar câmera" : "Ligar câmera"} aria-pressed={camera}>{camera ? <Camera /> : <CameraOff />}</Button>
        <Button size="lg" variant={sharing ? "default" : "secondary"} onClick={() => setSharing((value) => !value)} aria-label={sharing ? "Parar apresentação" : "Apresentar tela"} aria-pressed={sharing}><MonitorUp /> <span className="hidden sm:inline">{sharing ? "Parar apresentação" : "Apresentar"}</span></Button>
        <Button size="icon-lg" variant="secondary" aria-label="Configurar dispositivos" onClick={() => toast("Configuração de dispositivos simulada", { description: "A versão real permitirá trocar câmera, microfone e saída de áudio." })}><Settings2 /></Button>
        <Button size="lg" variant="destructive" onClick={onLeave} aria-label="Sair da chamada"><PhoneOff /> <span className="hidden sm:inline">Sair</span></Button>
      </div>
    </section>
  );
}

export function CommunicationPrototype({ specHref = "/app/salas/spec" }: { specHref?: string }) {
  const [view, setView] = useState<View>("directory");
  const [room, setRoom] = useState<Room>(rooms[0]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  function openPrejoin(selectedRoom: Room) {
    setRoom(selectedRoom);
    setView("prejoin");
  }

  return (
    <div className="grid gap-7">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Protótipo navegável</Badge><span className="text-xs text-muted-foreground">Dados ilustrativos</span></div>
          <h2 className="mt-4 max-w-xl font-display text-4xl tracking-[-0.04em] sm:text-5xl">Onde a equipe se encontra.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Explore salas, pré-entrada, chamada de vídeo e apresentação usando o layout atual da Convext.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="lg"><Link href={specHref}><FileText /> Ver spec de implementação</Link></Button>
          <CreateRoomDialog />
        </div>
      </header>

      <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Estado do protótipo">
        {[{ id: "directory", label: "Catálogo" }, { id: "prejoin", label: "Pré-entrada" }, { id: "call", label: "Chamada" }].map((step, index) => (
          <div key={step.id} className="flex items-center gap-2"><span className={cn("grid size-6 place-items-center rounded-full ring-1", view === step.id ? "bg-primary text-primary-foreground ring-primary" : "bg-secondary ring-border")}>{index + 1}</span><span className={cn(view === step.id && "text-foreground")}>{step.label}</span>{index < 2 ? <span className="mx-1 h-px w-6 bg-border sm:w-12" /> : null}</div>
        ))}
      </div>

      {view === "directory" ? <Directory onJoin={openPrejoin} /> : null}
      {view === "prejoin" ? <Prejoin room={room} onBack={() => setView("directory")} onEnter={() => setView("call")} /> : null}
      {view === "call" ? <ActiveCall room={room} onLeave={() => { setView("directory"); toast("Você saiu da sala", { description: "A mídia simulada foi encerrada." }); }} /> : null}

      <div className="flex items-start gap-3 rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground ring-1 ring-border">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Este protótipo representa os estados e a hierarquia da interface. Botões de mídia alteram apenas a simulação visual; nenhuma permissão, câmera ou microfone é acessado.</p>
      </div>
    </div>
  );
}
