import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deactivateEmployee, updateEmployee } from "@/lib/employees";
import { requireAreaAccess } from "@/lib/profile";
import { employeeSchema } from "@/lib/validations/employee";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireAreaAccess("equipe");
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const result = await updateEmployee(id, parsed.data, user.id);
  if (result.error || !result.employee) {
    const status = /último administrador|próprio acesso|Administradores/.test(result.error ?? "") ? 403 : 500;
    return NextResponse.json({ error: result.error || "Não foi possível salvar o funcionário." }, { status });
  }
  revalidatePath("/app", "layout");
  revalidatePath("/app/equipe");
  return NextResponse.json({ employee: result.employee });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, response } = await requireAreaAccess("equipe");
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await context.params;
  const error = await deactivateEmployee(id, user.id);
  if (error) {
    const status = /último administrador|próprio acesso|Administradores/.test(error) ? 403 : 500;
    return NextResponse.json({ error }, { status });
  }
  revalidatePath("/app", "layout");
  revalidatePath("/app/equipe");
  return NextResponse.json({ ok: true });
}
