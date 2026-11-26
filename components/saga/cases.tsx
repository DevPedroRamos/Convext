import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CasePreview } from "@/components/saga/case-preview";
import { Piece } from "@/components/saga/piece";
import { SectionHeading } from "@/components/saga/sections";
import { slugify } from "@/lib/case-model";
import { cases } from "@/lib/saga-content";

/** Cases em linhas editoriais. Linka para /cases/[slug] quando o case já está publicado. */
export function Cases({ publishedSlugs, covers }: { publishedSlugs: string[]; covers: Record<string, string> }) {
  return (
    <section id="cases" className="saga-light py-24 sm:py-32" data-header-theme="light">
      <div className="container-convext">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <SectionHeading index="07" eyebrow={cases.eyebrow} tone="light">
            {cases.title}
            <br />
            <em>{cases.accent}</em>
          </SectionHeading>
          <p className="max-w-[46ch] text-base leading-7 text-ink/65">{cases.body}</p>
        </div>

        <CasePreview covers={covers}>
        <ol className="mt-16 border-t border-ink/15">
          {cases.items.map((item, index) => {
            const slug = slugify(item.name);
            const href = publishedSlugs.includes(slug) ? `/cases/${slug}` : null;
            const body = (
              <>
                <span aria-hidden="true" className="case-fill absolute inset-0 bg-ink" />
                <div className="relative grid gap-6 py-9 sm:grid-cols-[3rem_1fr] lg:grid-cols-[3rem_1.1fr_1fr_3rem] lg:items-center lg:gap-10">
                  <span className="font-mono text-xs tabular-nums text-ink/45 case-muted">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50 case-muted">{item.tag}</p>
                    <h3 className="mt-2 font-display text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-[-0.055em]">{item.name}</h3>
                  </div>
                  <dl className="grid grid-cols-2 gap-6 sm:col-start-2 lg:col-start-auto">
                    {item.metrics.map((metric) => (
                      <div key={metric.label} className="flex flex-col-reverse gap-1">
                        <dt className="text-sm text-ink/55 case-muted">{metric.label}</dt>
                        <dd className="font-display text-3xl tracking-[-0.05em] tabular-nums text-primary">{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {href ? (
                    <span className="hidden size-12 place-items-center rounded-full border border-current/20 lg:grid">
                      <ArrowUpRight className="arrow-nudge size-5" />
                    </span>
                  ) : (
                    <Piece kind="rook" className="hidden h-10 w-auto text-ink/15 lg:block case-muted" />
                  )}
                </div>
              </>
            );
            return (
              <li key={item.name} data-case-key={slug} className="border-b border-ink/15">
                {href ? (
                  <Link href={href} className="case-row group relative -mx-4 block overflow-hidden px-4 sm:-mx-6 sm:px-6">
                    {body}
                  </Link>
                ) : (
                  <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
        </CasePreview>
      </div>
    </section>
  );
}
