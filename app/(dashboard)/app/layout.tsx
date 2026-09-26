import { redirect } from "next/navigation";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { getCurrentUserProfile, profileName } from "@/lib/profile";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) redirect("/login");
  const name = profileName(profile, user.email);
  const email = user.email || "";
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      <PageTransition subtle />
      <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
        <AppSidebar name={name} email={email} avatarUrl={avatarUrl} className="sticky top-0 hidden h-screen lg:flex" />
        <div className="min-w-0">
          <AppHeader name={name} email={email} avatarUrl={avatarUrl} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
