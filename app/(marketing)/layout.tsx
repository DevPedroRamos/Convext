import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Cursor } from "@/components/motion/cursor";
import { PointerSpotlight } from "@/components/motion/pointer-spotlight";
import { RouteCurtain } from "@/components/motion/route-curtain";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SmoothScroll />
      <Header />
      <RouteCurtain />
      <main>{children}</main>
      <Footer />
      <Cursor />
      <PointerSpotlight />
    </>
  );
}
