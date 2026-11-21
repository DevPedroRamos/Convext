import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { z } from "zod";
import type { Result } from "@/lib/spaces/data";
import { isAdmin, requireAreaAccess } from "@/lib/profile";

/** Usuário com acesso aos Espaços; `admin` exige admin (configuração). */
export async function guardSpaces(options: { admin?: boolean } = {}) {
  const result = await requireAreaAccess(options.admin ? "gestao" : "espacos");
  if (result.response) return { user: null, response: result.response };
  if (options.admin && !isAdmin(result.profile)) return { user: null, response: NextResponse.json({ error: "Apenas administradores." }, { status: 403 }) };
  return { user: result.user, response: null };
}

export async function parseBody<S extends z.ZodTypeAny>(request: Request, schema: S): Promise<{ data: z.infer<S>; response: null } | { data: null; response: NextResponse }> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return { data: null, response: NextResponse.json({ error: first || "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 }) };
  }
  return { data: parsed.data, response: null };
}

export function respond<T>(result: Result<T>, status = 200) {
  if (result.error !== null) return NextResponse.json({ error: result.error }, { status: 400 });
  revalidatePath("/app", "layout");
  return NextResponse.json({ data: result.data }, { status });
}

export type IdContext = { params: Promise<{ id: string }> };
