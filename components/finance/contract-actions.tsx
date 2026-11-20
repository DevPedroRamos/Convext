"use client";

import { Ban, Ellipsis, Pause, Play, Square, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { financeRequest } from "@/components/finance/api";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { todayIso } from "@/lib/finance/dates";
import type { Contract, ContractStatus } from "@/lib/finance/types";

export function ContractActions({ contract, canDelete }: { contract: Contract; canDelete: boolean }) {
  const router = useRouter();

  async function setStatus(status: ContractStatus, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    const endDate = status === "ended" || status === "cancelled" ? contract.endDate || todayIso() : undefined;
    if (await financeRequest(`/api/finance/contracts/${contract.id}`, "PATCH", { status, endDate }, "Contrato atualizado.")) router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Excluir o contrato “${contract.title}” e todas as parcelas? Prefira cancelar para manter o histórico.`)) return;
    if (await financeRequest(`/api/finance/contracts/${contract.id}`, "DELETE", undefined, "Contrato excluído.")) router.push("/app/financeiro/contratos");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Mais ações"><Ellipsis /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {contract.status === "active" ? <DropdownMenuItem onClick={() => setStatus("paused")}><Pause /> Pausar cobrança</DropdownMenuItem> : null}
        {contract.status === "paused" || contract.status === "ended" ? <DropdownMenuItem onClick={() => setStatus("active")}><Play /> Reativar</DropdownMenuItem> : null}
        {contract.status !== "ended" && contract.status !== "cancelled" ? (
          <DropdownMenuItem onClick={() => setStatus("ended", "Encerrar o contrato? As parcelas em aberto continuam.")}><Square /> Encerrar</DropdownMenuItem>
        ) : null}
        {contract.status !== "cancelled" ? (
          <DropdownMenuItem variant="destructive" onClick={() => setStatus("cancelled", "Cancelar o contrato? As parcelas em aberto serão canceladas.")}><Ban /> Cancelar contrato</DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={remove}><Trash /> Excluir</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
