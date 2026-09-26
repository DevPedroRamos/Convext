import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-background p-6 text-center"><div><p className="label text-primary">404</p><h1 className="mt-4 font-display text-h1">Página não encontrada.</h1><Button asChild className="mt-8 bg-primary text-primary-foreground"><Link href="/">Voltar para home</Link></Button></div></main>;
}
