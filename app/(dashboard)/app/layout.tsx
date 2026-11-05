import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppQuickActions } from "@/components/dashboard/app-quick-actions";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { PresencePrompt } from "@/components/dashboard/presence-prompt";
import { PageTransition } from "@/components/motion/page-transition";
import { listClients } from "@/lib/clients";
import { listFeedbackTypes } from "@/lib/feedback-types";
import { getCurrentUserProfile, isOnboardingComplete, isOperations, listCreators, listTeamProfiles, profileName } from "@/lib/profile";
import { listTeamStatuses } from "@/lib/team-status";

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
  const [clients, team, statuses, types, creators] = await Promise.all([
    showQuickActions ? listClients() : Promise.resolve([]),
    showQuickActions ? listTeamProfiles() : Promise.resolve([]),
    listTeamStatuses(),
    showQuickActions ? listFeedbackTypes() : Promise.resolve([]),
    showQuickActions ? listCreators() : Promise.resolve([]),
  ]);
  const presence = {
    available: Boolean(profile?.available),
    statusId: profile?.status_id ?? null,
    statuses,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageTransition subtle />
      <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
        <AppSidebar name={name} email={email} avatarUrl={avatarUrl} role={role} className="sticky top-0 hidden h-screen lg:flex" {...presence} />
        <div className="min-w-0">
          <AppHeader name={name} email={email} avatarUrl={avatarUrl} role={role} {...presence} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      {showQuickActions ? <AppQuickActions clients={clients} team={team} types={types} creators={creators} /> : null}
      <PresencePrompt />
    </div>
  );
}
