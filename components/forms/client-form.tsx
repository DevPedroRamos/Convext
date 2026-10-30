"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientRecord } from "@/lib/clients";
import type { TeamProfile } from "@/lib/profile";
import { clientSchema, type ClientValues } from "@/lib/validations/client";

type ClientFormProps = {
  team: TeamProfile[];
  record?: ClientRecord;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function emptyValues(): ClientValues {
  return { name: "", company: "ECON VENDAS", whatsapp: "", responsibleId: "" };
}

function fromRecord(record: ClientRecord): ClientValues {
  return {
    name: record.name,
    company: record.company,
    whatsapp: record.whatsapp || "",
    responsibleId: record.responsibleId || "",
  };
}

export function ClientForm({ team, record, onSuccess, onCancel }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: record ? fromRecord(record) : emptyValues(),
  });

  async function onSubmit(values: ClientValues) {
    setLoading(true);
    const response = await fetch(record ? `/api/clients/${record.id}` : "/api/clients", {
      method: record ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar.");
      return;
    }
    toast.success(record ? "Cliente atualizado." : "Cliente cadastrado.");
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push("/app/clientes");
    router.refresh();
  }

  const embedded = Boolean(onSuccess || onCancel);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={embedded ? "grid gap-4" : "surface grid gap-5 p-6 md:grid-cols-2"}>
      <Field label="Cliente" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} />
      </Field>
      <Field label="Empresa" error={form.formState.errors.company?.message}>
        <Input {...form.register("company")} />
      </Field>
      <Field label="WhatsApp" error={form.formState.errors.whatsapp?.message}>
        <Input {...form.register("whatsapp")} placeholder="11 99999-9999" />
      </Field>
      <Field label="Responsável" error={form.formState.errors.responsibleId?.message}>
        <Controller
          control={form.control}
          name="responsibleId"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sem responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {team.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {teamMemberName(member)}
                    {member.cargo ? ` · ${member.cargo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <div className={embedded ? "flex flex-wrap justify-end gap-2" : "flex flex-wrap gap-2 md:col-span-2"}>
        <Button type="button" variant="outline" onClick={() => (onCancel ? onCancel() : router.push("/app/clientes"))}>
          Cancelar
        </Button>
        <Button disabled={loading} className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="animate-spin" /> : null}
          {record ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}

function teamMemberName(member: TeamProfile) {
  return [member.firstName, member.lastName].filter(Boolean).join(" ").trim() || "Sem nome";
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
