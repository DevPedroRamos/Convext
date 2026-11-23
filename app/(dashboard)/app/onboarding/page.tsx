import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { getCurrentUserProfile, hasPasswordSet, isOnboardingComplete } from "@/lib/profile";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) redirect("/login");
  if (isOnboardingComplete(profile)) redirect("/app");
  return (
    <OnboardingForm
      userId={user.id}
      email={user.email || ""}
      firstName={profile?.first_name || ""}
      lastName={profile?.last_name || ""}
      cargo={profile?.cargo}
      requirePassword={!hasPasswordSet(user)}
      defaultValues={{
        phone: profile?.phone || "",
        avatarUrl: profile?.avatar_url || "",
      }}
    />
  );
}
