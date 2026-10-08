import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/marketing/case-study";
import { getPublishedCase } from "@/lib/cases";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { current } = await getPublishedCase(id);
  if (!current) notFound();
  return {
    title: current.name,
    description: current.summary,
  };
}

export default async function CasePage({ params }: PageProps) {
  const { id } = await params;
  const { current, prev, next } = await getPublishedCase(id);
  if (!current) notFound();
  return <CaseStudy current={current} prev={prev} next={next} />;
}
