import { sendEmployeeInvite } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canManageEmployeeRole,
  inviteAccessRole,
  type ContractType,
  type EmployeeRole,
  type EmployeeValues,
  type EmploymentStatus,
  type PaymentModel,
} from "@/lib/validations/employee";

type EmployeeRecordRow = {
  user_id: string;
  hired_on: string | null;
  employment_status: string;
  contract_type: string | null;
  payment_model: string | null;
  fixed_amount_cents: number | null;
  commission_percent: number | null;
  additional_amount_cents: number | null;
  payment_day: number | null;
};

type ManagedEmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  cargo: string | null;
  avatar_url: string | null;
  available: boolean | null;
  last_seen_at: string | null;
  status_id: string | null;
  status: { name: string; icon: string } | { name: string; icon: string }[] | null;
  employee: EmployeeRecordRow | EmployeeRecordRow[] | null;
};

export type ManagedEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  cargo: string;
  avatarUrl: string | null;
  available: boolean;
  lastSeenAt: string | null;
  statusId: string | null;
  statusName: string | null;
  statusIcon: string | null;
  hiredOn: string | null;
  employmentStatus: EmploymentStatus;
  contractType: ContractType | null;
  paymentModel: PaymentModel | null;
  fixedAmount: number | null;
  commissionPercent: number | null;
  additionalAmount: number | null;
  paymentDay: number | null;
  manageable: boolean;
};

const employeeSelect = `
  id, first_name, last_name, email, phone, role, cargo, avatar_url, available, last_seen_at, status_id,
  status:team_statuses(name, icon),
  employee:employee_records!employee_records_user_id_fkey(
    user_id, hired_on, employment_status, contract_type, payment_model,
    fixed_amount_cents, commission_percent, additional_amount_cents, payment_day
  )
`;

function moneyFromCents(value: number | null | undefined) {
  return value == null ? null : Number(value) / 100;
}

function moneyToCents(value: number | null) {
  return value == null ? null : Math.round(value * 100);
}

function mapEmployee(row: ManagedEmployeeRow): ManagedEmployee {
  const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee;
  const status = Array.isArray(row.status) ? row.status[0] : row.status;
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    role: row.role || "creator",
    cargo: row.cargo || "",
    avatarUrl: row.avatar_url,
    available: Boolean(row.available),
    lastSeenAt: row.last_seen_at ?? null,
    statusId: row.status_id,
    statusName: status?.name ?? null,
    statusIcon: status?.icon ?? null,
    hiredOn: employee?.hired_on ?? null,
    employmentStatus: employee?.employment_status === "inactive" ? "inactive" : "active",
    contractType: (employee?.contract_type as ContractType | null) ?? null,
    paymentModel: (employee?.payment_model as PaymentModel | null) ?? null,
    fixedAmount: moneyFromCents(employee?.fixed_amount_cents),
    commissionPercent: employee?.commission_percent == null ? null : Number(employee.commission_percent),
    additionalAmount: moneyFromCents(employee?.additional_amount_cents),
    paymentDay: employee?.payment_day ?? null,
    manageable: canManageEmployeeRole(row.role),
  };
}

async function deleteCreatedUser(admin: ReturnType<typeof createAdminClient>, userId: string) {
  await admin.from("employee_records").delete().eq("user_id", userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error?.message ?? null;
}

function employeeRecord(values: EmployeeValues, actorId: string) {
  return {
    hired_on: values.hiredOn,
    employment_status: values.employmentStatus,
    contract_type: values.contractType,
    payment_model: values.paymentModel,
    fixed_amount_cents: moneyToCents(values.fixedAmount),
    commission_percent: values.commissionPercent,
    additional_amount_cents: moneyToCents(values.additionalAmount),
    payment_day: values.paymentDay,
    updated_by: actorId,
  };
}

export async function listManagedEmployees(): Promise<ManagedEmployee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(employeeSelect)
    .order("first_name", { ascending: true });
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data.map((row) => mapEmployee(row as unknown as ManagedEmployeeRow));
}

export async function createEmployee(values: EmployeeValues, actorId: string) {
  const admin = createAdminClient();
  const redirectOrigin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080").replace(/\/$/, "");
  const { data: invited, error: inviteError } = await admin.auth.admin.generateLink({
    type: "invite",
    email: values.email,
    options: {
      redirectTo: `${redirectOrigin}/auth/callback?next=${encodeURIComponent("/app/onboarding")}`,
      data: { first_name: values.firstName, last_name: values.lastName },
    },
  });
  const inviteUrl = invited?.properties?.action_link;
  if (inviteError || !invited?.user || !inviteUrl) {
    return { employee: null, error: inviteError?.message || "Não foi possível criar o convite." };
  }

  const userId = invited.user.id;
  const accessRole = inviteAccessRole(values.role, values.cargo);
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: values.firstName,
      last_name: values.lastName || null,
      email: values.email,
      phone: values.phone || null,
      role: accessRole === "admin" ? "creator" : accessRole,
      cargo: values.cargo,
      available: false,
      onboarding_completed: false,
    })
    .eq("id", userId);

  if (profileError) {
    await deleteCreatedUser(admin, userId);
    return { employee: null, error: profileError.message || "Não foi possível concluir o cadastro." };
  }

  if (values.employmentStatus === "inactive") {
    const { error: banError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    if (banError) {
      await deleteCreatedUser(admin, userId);
      return { employee: null, error: "O convite foi criado, mas não foi possível deixar o acesso inativo." };
    }
  } else {
    const { error: emailError } = await sendEmployeeInvite({
      userId,
      email: values.email,
      firstName: values.firstName,
      inviteUrl,
    });
    if (emailError) {
      await deleteCreatedUser(admin, userId);
      return { employee: null, error: emailError };
    }
  }

  const { error: employeeError } = await admin.from("employee_records").upsert({
    user_id: userId,
    ...employeeRecord(values, actorId),
    created_by: actorId,
  }, { onConflict: "user_id" });

  if (employeeError) {
    await deleteCreatedUser(admin, userId);
    return { employee: null, error: employeeError.message || "Não foi possível concluir o cadastro." };
  }

  if (accessRole === "admin") {
    const { error: adminRoleError } = await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
    if (adminRoleError) {
      await deleteCreatedUser(admin, userId);
      return { employee: null, error: adminRoleError.message || "Não foi possível atribuir o acesso de admin." };
    }
  }

  const employee = await getManagedEmployee(userId);
  if (employee) return { employee, error: null };
  return {
    employee: mapEmployee({
      id: userId,
      first_name: values.firstName,
      last_name: values.lastName || null,
      email: values.email,
      phone: values.phone || null,
      role: accessRole,
      cargo: values.cargo,
      avatar_url: null,
      available: false,
      last_seen_at: null,
      status_id: null,
      status: null,
      employee: {
        user_id: userId,
        hired_on: values.hiredOn,
        employment_status: values.employmentStatus,
        contract_type: values.contractType,
        payment_model: values.paymentModel,
        fixed_amount_cents: values.fixedAmount == null ? null : Math.round(values.fixedAmount * 100),
        commission_percent: values.commissionPercent,
        additional_amount_cents: values.additionalAmount == null ? null : Math.round(values.additionalAmount * 100),
        payment_day: values.paymentDay,
      },
    }),
    error: null,
  };
}

export async function getManagedEmployee(id: string): Promise<ManagedEmployee | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select(employeeSelect).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapEmployee(data as unknown as ManagedEmployeeRow);
}

export async function updateEmployee(id: string, values: EmployeeValues, actorId: string) {
  const admin = createAdminClient();
  const current = await getManagedEmployee(id);
  if (!current) return { employee: null, error: "Funcionário não encontrado." };
  if (!current.manageable) return { employee: null, error: "Administradores não podem ser alterados." };

  const oldEmail = current.email;
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: values.email,
    ban_duration: values.employmentStatus === "inactive" ? "876000h" : "none",
    user_metadata: { first_name: values.firstName, last_name: values.lastName },
  });
  if (authError) return { employee: null, error: authError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: values.firstName,
      last_name: values.lastName || null,
      email: values.email,
      phone: values.phone || null,
      role: values.role as EmployeeRole,
      cargo: values.cargo,
      ...(values.employmentStatus === "inactive" ? { available: false } : {}),
    })
    .eq("id", id);

  const { error: employeeError } = profileError
    ? { error: null }
    : await admin.from("employee_records").upsert({
        user_id: id,
        ...employeeRecord(values, actorId),
      });

  if (profileError || employeeError) {
    const previousValues: EmployeeValues = {
      firstName: current.firstName,
      lastName: current.lastName,
      email: current.email,
      phone: current.phone,
      role: current.role as EmployeeRole,
      cargo: current.cargo,
      hiredOn: current.hiredOn,
      employmentStatus: current.employmentStatus,
      contractType: current.contractType,
      paymentModel: current.paymentModel,
      fixedAmount: current.fixedAmount,
      commissionPercent: current.commissionPercent,
      additionalAmount: current.additionalAmount,
      paymentDay: current.paymentDay,
    };
    await Promise.all([
      admin.auth.admin.updateUserById(id, {
        email: oldEmail || undefined,
        ban_duration: current.employmentStatus === "inactive" ? "876000h" : "none",
      }),
      admin.from("profiles").update({
        first_name: current.firstName,
        last_name: current.lastName || null,
        email: current.email,
        phone: current.phone || null,
        role: current.role,
        cargo: current.cargo,
        available: current.available,
      }).eq("id", id),
      admin.from("employee_records").upsert({ user_id: id, ...employeeRecord(previousValues, actorId) }),
    ]);
    return { employee: null, error: profileError?.message || employeeError?.message || "Não foi possível salvar o funcionário." };
  }

  return { employee: await getManagedEmployee(id), error: null };
}

export async function deactivateEmployee(id: string, actorId: string) {
  const current = await getManagedEmployee(id);
  if (!current) return "Funcionário não encontrado.";
  if (!current.manageable) return "Administradores não podem ser desativados.";
  const result = await updateEmployee(id, {
    firstName: current.firstName,
    lastName: current.lastName,
    email: current.email,
    phone: current.phone,
    role: current.role as EmployeeRole,
    cargo: current.cargo,
    hiredOn: current.hiredOn,
    employmentStatus: "inactive",
    contractType: current.contractType,
    paymentModel: current.paymentModel,
    fixedAmount: current.fixedAmount,
    commissionPercent: current.commissionPercent,
    additionalAmount: current.additionalAmount,
    paymentDay: current.paymentDay,
  }, actorId);
  return result.error;
}
