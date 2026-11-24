import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppQuickActions } from "@/components/dashboard/app-quick-actions";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { CommunicationShell } from "@/components/communication/communication-shell";
import { PresencePrompt } from "@/components/dashboard/presence-prompt";
import { PresenceRuntime } from "@/components/dashboard/presence-runtime";
import { PageTransition } from "@/components/motion/page-transition";
import { listClients } from "@/lib/clients";
import { listFeedbackTypes } from "@/lib/feedback-types";
import { resolveAppRole } from "@/lib/access";
import { getCurrentUserProfile, isOnboardingComplete, listTeamProfiles, profileName } from "@/lib/profile";
import { canSeeSpace, canSubmitForm } from "@/lib/spaces/rules";
import { listAttendeeOptions } from "@/lib/agenda/data";
import { countMyTurn, listForms, listQuickActions, listSpaces } from "@/lib/spaces/data";
import { createClient } from "@/lib/supabase/server";
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
  const viewer = { id: user.id, role: resolveAppRole(role) };
  const [statuses, spaces, forms, quickActions, clients, unreadNotifications, feedbackTypes, attendees] = await Promise.all([
    listTeamStatuses(),
    listSpaces(),
    listForms(),
    listQuickActions(),
    listClients(),
    countUnread(user.id),
    listFeedbackTypes(),
    listAttendeeOptions(),
  ]);
  const turn = await countMyTurn(viewer, spaces);
  const sidebarSpaces = spaces.map((space) => ({ id: space.id, name: space.name, color: space.color, count: turn[space.id] ?? 0, member: canSeeSpace(space, viewer) }));
  const myActions = quickActions.filter((action) => {
    if (!action.audienceRoles.includes(viewer.role)) return false;
    if (action.kind === "form") {
      const form = forms.find((item) => item.id === action.formId);
      return Boolean(form && canSubmitForm(form, viewer.role));
    }
    if (action.systemAction === "lead") return viewer.role === "admin" || viewer.role === "commercial";
    return true;
  });
  const team = myActions.some((action) => action.systemAction === "client") ? await listTeamProfiles() : [];
  const presence = {
    available: Boolean(profile?.available),
    lastSeenAt: profile?.last_seen_at ?? null,
    statusId: profile?.status_id ?? null,
    statuses,
  };

  return (
    <CommunicationShell>
      <PresenceRuntime selfId={user.id} lastSeenAt={profile?.last_seen_at ?? null}>
      <div className="min-h-screen bg-background">
        <PageTransition subtle />
        <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
          <AppSidebar name={name} email={email} avatarUrl={avatarUrl} role={role} spaces={sidebarSpaces} className="sticky top-0 hidden h-screen lg:flex" {...presence} />
          <div className="min-w-0">
            <AppHeader name={name} email={email} avatarUrl={avatarUrl} role={role} spaces={sidebarSpaces} unreadNotifications={unreadNotifications} {...presence} />
            <main className="p-4 pb-[calc(1rem+var(--call-dock-offset,0px))] sm:p-6 sm:pb-[calc(1.5rem+var(--call-dock-offset,0px))] lg:p-8 lg:pb-[calc(2rem+var(--call-dock-offset,0px))]">{children}</main>
          </div>
        </div>
        <AppQuickActions actions={myActions} forms={forms} spaces={spaces} clients={clients.map((client) => ({ id: client.id, name: client.name }))} attendees={attendees} team={team} feedbackTypes={feedbackTypes} />
        <PresencePrompt />
      </div>
      </PresenceRuntime>
    </CommunicationShell>
  );
}

async function countUnread(userId: string) {
  const supabase = await createClient();
  const { count } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
