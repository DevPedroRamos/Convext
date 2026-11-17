import { runCommunication } from "@/app/api/communication/_guard";
import { listPeople } from "@/lib/communication/people";

export async function GET(request: Request) {
  return runCommunication(request, async (ctx) => ({ people: await listPeople(ctx.supabase) }));
}
