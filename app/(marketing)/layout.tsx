import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { RouteCurtain } from "@/components/motion/route-curtain";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-motion-site>
      <SmoothScroll />
      <Header />
      <RouteCurtain />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
