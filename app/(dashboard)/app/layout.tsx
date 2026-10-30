import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppQuickActions } from "@/components/dashboard/app-quick-actions";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { listClients } from "@/lib/clients";
import { getCurrentUserProfile, isOnboardingComplete, isOperations, listTeamProfiles, profileName } from "@/lib/profile";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) redirect("/login");
  const name = profileName(profile, user.email);
  const email = user.email || "";
  const avatarUrl = profile?.avatar_url;

  if (!isOnboardingComplete(profile)) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background">
        <PageTransition subtle />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(243,87,3,.24),transparent_34%)]" />
        <div className="noise absolute inset-0" />
        <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10">
          <Link href="/" className="mx-auto mb-8 block w-fit">
            <Image src="/brand/logo-lockup.png" alt="Convext" width={778} height={210} className="h-11 w-auto object-contain" />
          </Link>
          {children}
        </div>
      </main>
    );
  }

  const role = profile?.role;
  const showQuickActions = isOperations(profile);
  const [clients, team] = showQuickActions
    ? await Promise.all([listClients(), listTeamProfiles()])
    : [[], []];

  return (
    <div className="min-h-screen bg-background">
      <PageTransition subtle />
      <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
        <AppSidebar name={name} email={email} avatarUrl={avatarUrl} role={role} className="sticky top-0 hidden h-screen lg:flex" />
        <div className="min-w-0">
          <AppHeader name={name} email={email} avatarUrl={avatarUrl} role={role} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      {showQuickActions ? <AppQuickActions clients={clients} team={team} /> : null}
    </div>
  );
}
