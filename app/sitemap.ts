import type { MetadataRoute } from "next";
import { siteUrl, configured } from "@/config/site";
import { db } from "@/lib/supabase/server";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = [
    "",
    "/vehicules",
    "/reprise",
    "/financement",
    "/atelier",
    "/rendez-vous",
    "/a-propos",
    "/contact",
    "/mentions-legales",
    "/politique-confidentialite",
  ].map((p) => ({ url: `${siteUrl}${p}` }));
  if (!configured) return urls;
  const c = await db();
  const { data, error } = await c
    .from("vehicle_listings")
    .select("slug,published_at")
    .eq("business_id", process.env.SALES_BUSINESS_ID!)
    .in("status", ["AVAILABLE", "RESERVED"])
    .limit(1000);
  if (error) throw Error("Sitemap indisponible");
  return [
    ...urls,
    ...(data || []).map((l) => ({
      url: `${siteUrl}/vehicules/${l.slug}`,
      ...(l.published_at ? { lastModified: new Date(l.published_at) } : {}),
    })),
  ];
}
