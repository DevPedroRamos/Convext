import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { listTeamProfiles, profileName } from "@/lib/profile";
import { teamStatusIcon } from "@/lib/team-status-icons";
import { cn } from "@/lib/utils";

export default async function EquipePage() {
  const members = await listTeamProfiles();

  return (
    <div className="grid gap-8">
      <div>
        <p className="label text-primary">Equipe</p>
        <h2 className="mt-2 font-display text-h2">Presença e status.</h2>
      </div>

      <section className="grid gap-4">
        <h3 className="text-sm font-medium">{members.length} pessoas</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => {
            const name = profileName(
              { first_name: member.firstName, last_name: member.lastName },
              member.email
            );
            const StatusIcon = member.statusIcon ? teamStatusIcon(member.statusIcon) : null;
            return (
              <Card key={member.id}>
                <CardContent className="flex gap-4 pt-1">
                  <span className="relative size-12 shrink-0">
                    <Avatar className="size-12">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", member.available ? "bg-emerald-400" : "bg-zinc-500")} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">{member.cargo || "Cargo não informado"}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className={cn("rounded-full px-2 py-0.5", member.available ? "bg-emerald-400/15 text-emerald-300" : "bg-zinc-500/20 text-muted-foreground")}>
                        {member.available ? "Disponível" : "Ausente"}
                      </span>
                      {member.statusName && StatusIcon ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                          <StatusIcon className="size-3" />
                          {member.statusName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sem status</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
