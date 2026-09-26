import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Archivo, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const calibri = localFont({
  src: [
    { path: "../fontes/calibri-font/calibril.ttf", weight: "300", style: "normal" },
    { path: "../fontes/calibri-font/calibri.ttf", weight: "400", style: "normal" },
    { path: "../fontes/calibri-font/calibrii.ttf", weight: "400", style: "italic" },
    { path: "../fontes/calibri-font/calibrib.ttf", weight: "700", style: "normal" },
    { path: "../fontes/calibri-font/calibriz.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-calibri",
  display: "swap",
});

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "Convext — Marketing, criatividade e tecnologia", template: "%s — Convext" },
  description: "Agência de marketing, tecnologia e criatividade focada na construção de marcas e experiências digitais.",
  applicationName: "Convext",
  keywords: ["Convext", "marketing", "criatividade", "tecnologia", "branding", "performance"],
  openGraph: {
    title: "Convext — Marketing, criatividade e tecnologia",
    description: "Estratégia, tecnologia e criatividade trabalhando juntas para transformar marcas em experiências que geram resultado.",
    url: "/",
    siteName: "Convext",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Convext" }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convext — Marketing, criatividade e tecnologia",
    description: "Marketing, criatividade e tecnologia para marcas em movimento.",
    images: ["/brand/og.png"],
  },
  icons: { icon: "/brand/favicon.svg", apple: "/brand/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${calibri.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
