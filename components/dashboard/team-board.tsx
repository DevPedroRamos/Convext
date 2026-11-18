"use client";

import { Loader2, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmployeeDetailSheet } from "@/components/dashboard/employee-detail-sheet";
import { employeeRoleLabel } from "@/components/dashboard/employee-form-fields";
import { NewEmployeeDialog } from "@/components/dashboard/new-employee-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ManagedEmployee } from "@/lib/employees";
import { teamStatusIcon } from "@/lib/team-status-icons";
import { cn } from "@/lib/utils";

export function TeamBoard({ employees }: { employees: ManagedEmployee[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ManagedEmployee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedEmployee | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deactivate() {
    if (!deleteTarget) return;
    setDeleting(true);
    const response = await fetch(`/api/equipe/${deleteTarget.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setDeleting(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível desativar o funcionário.");
      return;
    }
    toast.success("Funcionário desativado. O histórico foi preservado.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label text-primary">Equipe</p>
          <h2 className="mt-2 font-display text-h2">Presença e gestão.</h2>
        </div>
        <NewEmployeeDialog />
      </div>

      <section className="grid gap-4">
        <h3 className="text-sm font-medium">{employees.length} pessoas</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => {
            const name = employeeName(employee);
            const StatusIcon = employee.statusIcon ? teamStatusIcon(employee.statusIcon) : null;
            return (
              <Card key={employee.id}>
                <CardContent className="grid gap-4 pt-1">
                  <div className="flex gap-4">
                    <span className="relative size-12 shrink-0">
                      <Avatar className="size-12">
                        <AvatarImage src={employee.avatarUrl || undefined} />
                        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", employee.available ? "bg-emerald-400" : "bg-zinc-500")} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{name}</p>
                          <p className="truncate text-sm text-muted-foreground">{employee.cargo || "Cargo não informado"}</p>
                        </div>
                        {employee.manageable ? (
                          <div className="flex shrink-0 gap-1">
                            <Button variant="ghost" size="icon" aria-label={`Editar ${name}`} title="Editar" onClick={() => setSelected(employee)}>
                              <Pencil />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Excluir ${name}`} title="Excluir" onClick={() => setDeleteTarget(employee)}>
                              <Trash2 />
                            </Button>
                          </div>
                        ) : (
                          <span title="Administrador protegido"><ShieldCheck className="size-4 text-primary" /></span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn("rounded-full px-2 py-0.5", employee.employmentStatus === "active" ? "bg-emerald-400/15 text-emerald-300" : "bg-destructive/15 text-destructive")}>
                      {employee.employmentStatus === "active" ? "Ativo" : "Inativo"}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5">{employeeRoleLabel(employee.role)}</span>
                    {employee.statusName && StatusIcon ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        <StatusIcon className="size-3" />
                        {employee.statusName}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <EmployeeDetailSheet employee={selected} onClose={() => setSelected(null)} />
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir funcionário?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `${deleteTarget.firstName || deleteTarget.email} ficará inativo e perderá o acesso. O histórico será preservado.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={deactivate} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Desativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function employeeName(employee: ManagedEmployee) {
  return [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim() || employee.email.split("@")[0] || "Convext";
}
