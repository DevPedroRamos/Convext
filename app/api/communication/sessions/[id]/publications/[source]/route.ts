import { runCommunication } from "@/app/api/communication/_guard";
import { publishOk, releasePublication, reservePublication } from "@/lib/communication/sessions";
import { participationSchema, publicationSourceSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

type Params = { params: Promise<{ id: string; source: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, source } = await params;
  const parsedSource = publicationSourceSchema.safeParse(source);
  if (!parsedSource.success) {
    return runCommunication(request, async () => {
      throw new CommunicationError("INVALID_INPUT", "Fonte inválida.");
    });
  }
  return runCommunication(request, async (ctx) => {
    const parsed = participationSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    const reserved = await reservePublication(ctx.supabase, ctx.user.id, id, parsed.data.participationId, parsedSource.data);
    return reserved;
  }, { mutate: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id, source } = await params;
  const parsedSource = publicationSourceSchema.safeParse(source);
  return runCommunication(request, async (ctx) => {
    if (!parsedSource.success) throw new CommunicationError("INVALID_INPUT", "Fonte inválida.");
    const parsed = participationSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    await releasePublication(ctx.supabase, id, parsed.data.participationId, parsedSource.data);
    const leaseId = (ctx as unknown as { body?: { leaseId?: string } }).body?.leaseId;
    if (typeof leaseId === "string") {
      await publishOk(ctx.supabase, leaseId).catch(() => undefined);
    }
    return { ok: true };
  }, { mutate: true });
}
