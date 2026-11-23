import { redirect } from "next/navigation";
import { getCurrentUserProfile, isOnboardingComplete } from "@/lib/profile";

export default async function ConfirmarPage() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) redirect("/login");
  if (isOnboardingComplete(profile)) redirect("/app");
  redirect("/app/onboarding");
}
