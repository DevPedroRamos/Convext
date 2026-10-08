import { CaseForm } from "@/components/forms/case-form";
import { getCurrentUserProfile } from "@/lib/profile";

export default async function NewCasePage() {
  const { user } = await getCurrentUserProfile();
  if (!user) return null;
  return (
    <div className="grid gap-6">
      <div>
        <p className="label text-primary">Cases</p>
        <h2 className="mt-2 font-display text-h2">Novo cliente.</h2>
      </div>
      <CaseForm userId={user.id} />
    </div>
  );
}
