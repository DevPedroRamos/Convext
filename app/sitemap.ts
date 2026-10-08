import type { MetadataRoute } from "next";
import { listPublishedCases } from "@/lib/cases";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/contato", "/login", "/esqueci-senha", "/redefinir-senha", "/design-system"];
  const cases = await listPublishedCases();
  return [
    ...routes.map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.7 })),
    ...cases.filter((item) => item.slug).map((item) => ({ url: `${siteConfig.url}/cases/${item.slug}`, lastModified: new Date(item.createdAt), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
