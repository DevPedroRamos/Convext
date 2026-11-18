import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createEmployee, listManagedEmployees } from "@/lib/employees";
import { requireAreaAccess } from "@/lib/profile";
import { employeeSchema } from "@/lib/validations/employee";

export async function GET() {
  const { response } = await requireAreaAccess("equipe");
  if (response) return response;
  return NextResponse.json({ employees: await listManagedEmployees() });
}

export async function POST(request: Request) {
  const { user, response } = await requireAreaAccess("equipe");
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const result = await createEmployee(parsed.data, user.id);
  if (result.error || !result.employee) {
    return NextResponse.json({ error: result.error || "Não foi possível cadastrar o funcionário." }, { status: 500 });
  }
  revalidatePath("/app", "layout");
  revalidatePath("/app/equipe");
  return NextResponse.json({ employee: result.employee }, { status: 201 });
}
