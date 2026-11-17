import { runCommunication } from "@/app/api/communication/_guard";
import { patchMemberRole, removeMember } from "@/lib/communication/rooms";
import { memberRoleSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const { id, userId } = await params;
  return runCommunication(request, async (ctx) => {
    await removeMember(ctx.supabase, id, userId);
    return { ok: true };
  }, { mutate: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, userId } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = memberRoleSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    await patchMemberRole(ctx.supabase, id, userId, parsed.data.role);
    return { ok: true };
  }, { mutate: true });
}
