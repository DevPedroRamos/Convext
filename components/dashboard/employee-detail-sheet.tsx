"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  EmployeeContractFields,
  EmployeeFinancialFields,
  EmployeePersonalFields,
} from "@/components/dashboard/employee-form-fields";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ManagedEmployee } from "@/lib/employees";
import { employeeSchema, type EmployeeValues } from "@/lib/validations/employee";

export function EmployeeDetailSheet({
  employee,
  onClose,
}: {
  employee: ManagedEmployee | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(employee)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" size="panel">
        {employee ? <EmployeeEditForm key={employee.id} employee={employee} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function EmployeeEditForm({ employee, onClose }: { employee: ManagedEmployee; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeValues>(() => fromEmployee(employee));
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeValues, string>>>({});
  const [saving, setSaving] = useState(false);

  function setValue<Key extends keyof EmployeeValues>(key: Key, value: EmployeeValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function save() {
    const parsed = employeeSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Revise os dados informados.");
      return;
    }
    setSaving(true);
    const response = await fetch(`/api/equipe/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar o funcionário.");
      return;
    }
    toast.success(parsed.data.employmentStatus === "active" ? "Funcionário atualizado." : "Funcionário atualizado e acesso desativado.");
    onClose();
    router.refresh();
  }

  return (
    <div className="grid gap-7">
      <SheetHeader>
        <SheetTitle>{[employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.email}</SheetTitle>
        <SheetDescription>Edite os dados pessoais, contratuais e financeiros do funcionário.</SheetDescription>
      </SheetHeader>
      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Dados e acesso</h3>
        <EmployeePersonalFields values={values} errors={errors} setValue={setValue} />
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Contrato</h3>
        <EmployeeContractFields values={values} errors={errors} setValue={setValue} />
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Financeiro</h3>
        <EmployeeFinancialFields values={values} errors={errors} setValue={setValue} />
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Fechar</Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function fromEmployee(employee: ManagedEmployee): EmployeeValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    role: employee.role as EmployeeValues["role"],
    cargo: employee.cargo,
    hiredOn: employee.hiredOn,
    employmentStatus: employee.employmentStatus,
    contractType: employee.contractType,
    paymentModel: employee.paymentModel,
    fixedAmount: employee.fixedAmount,
    commissionPercent: employee.commissionPercent,
    additionalAmount: employee.additionalAmount,
    paymentDay: employee.paymentDay,
  };
}
