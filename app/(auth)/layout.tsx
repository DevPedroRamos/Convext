import Image from "next/image";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <PageTransition subtle />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(243,87,3,.24),transparent_34%)]" />
      <div className="noise absolute inset-0" />
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-md place-items-center px-4 py-10">
        <div className="w-full">
          <Link href="/" className="mx-auto mb-8 block w-fit">
            <Image src="/brand/logo-lockup.png" alt="Convext" width={778} height={210} className="h-11 w-auto object-contain" />
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
