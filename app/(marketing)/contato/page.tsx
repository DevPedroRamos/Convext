import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Contato" };

export default function ContactPage() {
  return (
    <div className="pt-28">
      <Container className="grid min-h-[calc(100vh-7rem)] gap-10 pb-20 pt-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <aside className="lg:sticky lg:top-28">
          <p className="label text-primary">Contato</p>
          <h1 className="mt-5 max-w-2xl font-display text-h1">Vamos criar algo relevante.</h1>
          <p className="mt-6 max-w-md text-foreground/65">Conte para nós sobre sua marca, projeto ou desafio. Nosso time entra em contato para entender como a Convext pode ajudar.</p>
          <div className="mt-10 divide-y divide-border border-y border-border text-sm">
            <Info label="E-mail" value={siteConfig.contact.email} href={`mailto:${siteConfig.contact.email}`} />
            <Info label="Telefone" value={siteConfig.contact.phone} href={`tel:${siteConfig.contact.phone}`} />
            <Info label="Instagram" value="@convext" href={siteConfig.contact.instagram} />
          </div>
        </aside>
        <ContactForm />
      </Container>
    </div>
  );
}

function Info({ label, value, href }: { label: string; value: string; href: string }) {
  return <div className="grid grid-cols-[120px_1fr] gap-4 py-4"><span className="label">{label}</span><Link className="text-foreground/85 hover:text-primary" href={href}>{value}</Link></div>;
}
