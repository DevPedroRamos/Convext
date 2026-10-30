import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { getCurrentUserProfile, isOnboardingComplete } from "@/lib/profile";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) redirect("/login");
  if (isOnboardingComplete(profile)) redirect("/app");
  return (
    <OnboardingForm
      userId={user.id}
      email={user.email || ""}
      cargo={profile?.cargo}
      defaultValues={{
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        phone: profile?.phone || "",
        avatarUrl: profile?.avatar_url || "",
      }}
    />
  );
}
