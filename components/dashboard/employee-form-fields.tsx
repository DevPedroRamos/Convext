"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EmployeeValues } from "@/lib/validations/employee";

type FieldErrors = Partial<Record<keyof EmployeeValues, string>>;
type FieldsProps = {
  values: EmployeeValues;
  errors?: FieldErrors;
  setValue: <Key extends keyof EmployeeValues>(key: Key, value: EmployeeValues[Key]) => void;
};

const roleLabels = {
  coordinator: "Coordenador",
  traffic: "Tráfego",
  creator: "Criativo",
  commercial: "Comercial",
} as const;

const contractLabels = {
  clt: "CLT",
  pj: "PJ",
  freelancer: "Freelancer",
  partner_admin: "Sócio (adm)",
} as const;

const paymentLabels = {
  fixed: "Fixo",
  commission: "Comissão",
  fixed_commission: "Fixo + comissão",
  custom: "Personalizado",
} as const;

export function EmployeePersonalFields({ values, errors, setValue }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" error={errors?.firstName}>
        <Input value={values.firstName} onChange={(event) => setValue("firstName", event.target.value)} />
      </Field>
      <Field label="Sobrenome" error={errors?.lastName}>
        <Input value={values.lastName} onChange={(event) => setValue("lastName", event.target.value)} />
      </Field>
      <Field label="E-mail" error={errors?.email}>
        <Input type="email" value={values.email} onChange={(event) => setValue("email", event.target.value)} />
      </Field>
      <Field label="Telefone" error={errors?.phone}>
        <Input value={values.phone} onChange={(event) => setValue("phone", event.target.value)} placeholder="11 99999-9999" />
      </Field>
      <Field label="Perfil de acesso" error={errors?.role}>
        <Select value={values.role} onValueChange={(value) => setValue("role", value as EmployeeValues["role"])}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Cargo" error={errors?.cargo}>
        <>
          <Input list="employee-cargo-options" value={values.cargo} onChange={(event) => setValue("cargo", event.target.value)} />
          <datalist id="employee-cargo-options">
            <option value="Comercial" />
            <option value="Coordenador" />
            <option value="Gestor de tráfego" />
            <option value="Criativo" />
          </datalist>
        </>
      </Field>
    </div>
  );
}

export function EmployeeContractFields({ values, errors, setValue }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Data de entrada" error={errors?.hiredOn}>
        <Input type="date" value={values.hiredOn || ""} onChange={(event) => setValue("hiredOn", event.target.value || null)} />
      </Field>
      <Field label="Status" error={errors?.employmentStatus}>
        <Select value={values.employmentStatus} onValueChange={(value) => setValue("employmentStatus", value as EmployeeValues["employmentStatus"])}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Tipo de contrato" error={errors?.contractType}>
        <Select value={values.contractType || "none"} onValueChange={(value) => setValue("contractType", value === "none" ? null : value as EmployeeValues["contractType"])}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não informado</SelectItem>
            {Object.entries(contractLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

export function EmployeeFinancialFields({ values, errors, setValue }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Modelo de pagamento" error={errors?.paymentModel}>
        <Select value={values.paymentModel || "none"} onValueChange={(value) => setValue("paymentModel", value === "none" ? null : value as EmployeeValues["paymentModel"])}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não informado</SelectItem>
            {Object.entries(paymentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <MoneyField label="Fixo (R$)" value={values.fixedAmount} error={errors?.fixedAmount} onChange={(value) => setValue("fixedAmount", value)} />
      <NumberField label="Comissão (%)" value={values.commissionPercent} error={errors?.commissionPercent} max={100} onChange={(value) => setValue("commissionPercent", value)} />
      <MoneyField label="Adicional (R$)" value={values.additionalAmount} error={errors?.additionalAmount} onChange={(value) => setValue("additionalAmount", value)} />
      <NumberField label="Dia do pagamento" value={values.paymentDay} error={errors?.paymentDay} min={1} max={31} step={1} onChange={(value) => setValue("paymentDay", value)} />
    </div>
  );
}

export function employeeRoleLabel(role: string) {
  return roleLabels[role as keyof typeof roleLabels] || role;
}

export function employeeContractLabel(contract: string | null) {
  return contract ? contractLabels[contract as keyof typeof contractLabels] || contract : "Não informado";
}

export function employeePaymentLabel(model: string | null) {
  return model ? paymentLabels[model as keyof typeof paymentLabels] || model : "Não informado";
}

function parseNumber(value: string) {
  return value === "" ? null : Number(value);
}

function MoneyField({ label, value, error, onChange }: { label: string; value: number | null; error?: string; onChange: (value: number | null) => void }) {
  return (
    <Field label={label} error={error}>
      <Input type="number" min="0" step="0.01" value={value ?? ""} onChange={(event) => onChange(parseNumber(event.target.value))} />
    </Field>
  );
}

function NumberField({
  label,
  value,
  error,
  min = 0,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number | null;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <Field label={label} error={error}>
      <Input type="number" min={min} max={max} step={step} value={value ?? ""} onChange={(event) => onChange(parseNumber(event.target.value))} />
    </Field>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
