import { redirect } from "next/navigation";
import { InviteConfirmForm } from "@/components/forms/invite-confirm-form";
import { getCurrentUserProfile, hasPasswordSet, isOnboardingComplete } from "@/lib/profile";

export default async function ConfirmarPage() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) redirect("/login");
  if (isOnboardingComplete(profile)) redirect("/app");
  if (hasPasswordSet(user)) redirect("/app/onboarding");
  return (
    <InviteConfirmForm
      firstName={profile?.first_name || ""}
      lastName={profile?.last_name || ""}
      email={user.email || ""}
      cargo={profile?.cargo || ""}
    />
  );
}
