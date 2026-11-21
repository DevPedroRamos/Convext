import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { z } from "zod";
import type { AppArea } from "@/lib/access";
import type { Result } from "@/lib/finance/data";
import { isAdmin, requireAreaAccess } from "@/lib/profile";

type FinanceArea = Extract<AppArea, "financeiro_comercial" | "financeiro_admin">;

/** Autoriza a área; `adminOnly` cobre exclusões, que a RLS ignoraria em silêncio. */
export async function guard(area: FinanceArea, options: { adminOnly?: boolean } = {}) {
  const result = await requireAreaAccess(area);
  if (result.response) return result.response;
  if (options.adminOnly && !isAdmin(result.profile)) {
    return NextResponse.json({ error: "Apenas administradores podem fazer isso." }, { status: 403 });
  }
  return null;
}

export async function parseBody<S extends z.ZodTypeAny>(request: Request, schema: S): Promise<{ data: z.infer<S>; response: null } | { data: null; response: NextResponse }> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { data: null, response: NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 }) };
  }
  return { data: parsed.data, response: null };
}

export function respond<T>(result: Result<T>, status = 200, revalidate: string[] = []) {
  if (result.error !== null) return NextResponse.json({ error: result.error }, { status: 400 });
  for (const path of revalidate) revalidatePath(path);
  return NextResponse.json({ data: result.data }, { status });
}

export type IdContext = { params: Promise<{ id: string }> };

export const COMMERCIAL_PATHS = ["/app/financeiro", "/app/financeiro/comercial", "/app/financeiro/leads", "/app/financeiro/contratos", "/app/financeiro/clientes", "/app/financeiro/produtos"];
export const ADMIN_PATHS = ["/app/financeiro/admin", "/app/financeiro/admin/folha", "/app/financeiro/admin/balanco", "/app/financeiro/admin/gestao"];
