import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export const metadata = { robots: { index: false, follow: false } };

export default function PrototypePreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
        <AppSidebar
          name="Pedro Ramos"
          email="preview@convext.local"
          role="admin"
          available
          lastSeenAt={new Date().toISOString()}
          statuses={[]}
          className="sticky top-0 hidden h-screen lg:flex"
        />
        <div className="min-w-0">
          <AppHeader
            title="Salas"
            name="Pedro Ramos"
            email="preview@convext.local"
            role="admin"
            available
            lastSeenAt={new Date().toISOString()}
            statuses={[]}
          />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
