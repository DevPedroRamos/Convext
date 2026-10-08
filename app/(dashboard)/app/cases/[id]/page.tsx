import { notFound } from "next/navigation";
import { CaseForm } from "@/components/forms/case-form";
import { getCaseById } from "@/lib/cases";
import { getCurrentUserProfile } from "@/lib/profile";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getCurrentUserProfile();
  if (!user) return null;
  const record = await getCaseById(id);
  if (!record) notFound();
  return (
    <div className="grid gap-6">
      <div>
        <p className="label text-primary">Cases</p>
        <h2 className="mt-2 font-display text-h2">Editar {record.name}.</h2>
      </div>
      <CaseForm userId={user.id} record={record} />
    </div>
  );
}
