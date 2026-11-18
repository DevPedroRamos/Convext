"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  EmployeeContractFields,
  EmployeeFinancialFields,
  EmployeePersonalFields,
  employeeContractLabel,
  employeePaymentLabel,
  employeeRoleLabel,
} from "@/components/dashboard/employee-form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  employeeContractSchema,
  employeePersonalSchema,
  employeeSchema,
  type EmployeeValues,
} from "@/lib/validations/employee";

const steps = ["Dados e acesso", "Contrato", "Financeiro e revisão"];

function emptyEmployee(): EmployeeValues {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "traffic",
    cargo: "",
    hiredOn: null,
    employmentStatus: "active",
    contractType: null,
    paymentModel: null,
    fixedAmount: null,
    commissionPercent: null,
    additionalAmount: null,
    paymentDay: null,
  };
}

export function NewEmployeeDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<EmployeeValues>(emptyEmployee);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeValues, string>>>({});
  const [saving, setSaving] = useState(false);

  function setValue<Key extends keyof EmployeeValues>(key: Key, value: EmployeeValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function close(force = false) {
    if (saving && !force) return;
    setOpen(false);
    setStep(0);
    setValues(emptyEmployee());
    setErrors({});
  }

  function next() {
    const schema = step === 0 ? employeePersonalSchema : employeeContractSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit() {
    const parsed = employeeSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      toast.error("Revise os dados informados.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/equipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível adicionar o funcionário.");
      return;
    }
    toast.success("Funcionário adicionado e convite enviado.");
    close(true);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus /> Adicionar funcionário
      </Button>
      <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar funcionário</DialogTitle>
            <DialogDescription>Preencha as etapas e envie o convite de acesso por e-mail.</DialogDescription>
          </DialogHeader>
          <ol className="grid grid-cols-3 gap-2" aria-label="Etapas do cadastro">
            {steps.map((label, index) => (
              <li key={label} className="grid gap-1">
                <span className={`h-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />
                <span className={`text-xs ${index === step ? "text-foreground" : "text-muted-foreground"}`}>
                  {index < step ? <Check className="mr-1 inline size-3" /> : null}
                  {label}
                </span>
              </li>
            ))}
          </ol>

          {step === 0 ? <EmployeePersonalFields values={values} errors={errors} setValue={setValue} /> : null}
          {step === 1 ? <EmployeeContractFields values={values} errors={errors} setValue={setValue} /> : null}
          {step === 2 ? (
            <div className="grid gap-6">
              <EmployeeFinancialFields values={values} errors={errors} setValue={setValue} />
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Revisão</p>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Review label="Funcionário" value={`${values.firstName} ${values.lastName}`.trim()} />
                  <Review label="E-mail" value={values.email} />
                  <Review label="Acesso" value={employeeRoleLabel(values.role)} />
                  <Review label="Cargo" value={values.cargo} />
                  <Review label="Contrato" value={employeeContractLabel(values.contractType)} />
                  <Review label="Pagamento" value={employeePaymentLabel(values.paymentModel)} />
                </dl>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={step === 0 ? () => close() : () => setStep((current) => current - 1)} disabled={saving}>
              {step === 0 ? "Cancelar" : "Voltar"}
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={next}>Continuar</Button>
            ) : (
              <Button type="button" onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Enviar convite
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message]));
}

function Review({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd>{value || "Não informado"}</dd></div>;
}
