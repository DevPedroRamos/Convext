import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CaseDeleteButton } from "@/components/dashboard/case-delete-button";
import { Button } from "@/components/ui/button";
import { listAllCases } from "@/lib/cases";

export default async function CasesAdminPage() {
  const cases = await listAllCases();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-primary">Cases</p>
          <h2 className="mt-2 font-display text-h2">Clientes no site.</h2>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/app/cases/novo"><Plus /> Novo case</Link>
        </Button>
      </div>

      {cases.length === 0 ? (
        <div className="surface p-8 text-muted-foreground">Nenhum cliente cadastrado. O primeiro case aparece na home assim que for publicado.</div>
      ) : (
        <div className="grid gap-4">
          {cases.map((item) => (
            <article key={item.id} className="surface grid gap-4 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary sm:aspect-auto sm:h-24">
                <Image src={item.coverUrl || item.logoUrl} alt="" fill className="object-cover" sizes="120px" />
              </div>
              <div className="min-w-0">
                <p className="label">{item.published ? "Publicado" : "Rascunho"} · {item.segment}</p>
                <h3 className="mt-1 truncate text-xl tracking-[-0.04em]">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.published ? (
                  <Button asChild variant="outline"><Link href={`/cases/${item.slug}`} target="_blank">Ver no site</Link></Button>
                ) : null}
                <Button asChild variant="outline"><Link href={`/app/cases/${item.id}`}>Editar</Link></Button>
                <CaseDeleteButton id={item.id} name={item.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
