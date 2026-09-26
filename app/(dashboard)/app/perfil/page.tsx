import { ProfileForm } from "@/components/forms/profile-form";
import { getCurrentUserProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) return null;
  return (
    <div className="grid gap-6">
      <div><p className="label text-primary">Perfil</p><h2 className="mt-2 font-display text-h2">Seus dados.</h2></div>
      <ProfileForm userId={user.id} email={user.email || ""} defaultValues={{ firstName: profile?.first_name || "", lastName: profile?.last_name || "", phone: profile?.phone || "", company: profile?.company || "", role: profile?.role || "", avatarUrl: profile?.avatar_url || "" }} />
    </div>
  );
}
