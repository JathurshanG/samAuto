import "server-only";
import { db } from "@/lib/supabase/server";
import { configured } from "@/config/site";
import type { Listing } from "@/types/domain";
export type Filters = Record<string, string | undefined>;
export async function catalogue(p: Filters) {
  if (!configured) return { items: [] as Listing[], count: 0, page: 1 };
  const c = await db();
  const page = Math.max(1, Math.min(10000, Number(p.page) || 1));
  let q = c
    .from("vehicle_listings")
    .select("*,vehicles!inner(*,vehicle_images(id,position))", {
      count: "exact",
    })
    .eq("business_id", process.env.SALES_BUSINESS_ID!)
    .in("status", ["AVAILABLE", "RESERVED"]);
  for (const key of ["make", "model", "fuel", "transmission", "body", "color"])
    if (p[key]) q = q.eq(`vehicles.${key}`, p[key]!.slice(0, 200));
  for (const [key, column, op] of [
    ["min_price", "price", "gte"],
    ["max_price", "price", "lte"],
    ["min_year", "vehicles.year", "gte"],
    ["max_year", "vehicles.year", "lte"],
    ["max_mileage", "vehicles.mileage", "lte"],
    ["power", "vehicles.power", "gte"],
    ["doors", "vehicles.doors", "eq"],
  ]) {
    if (p[key] && Number.isFinite(Number(p[key])))
      q =
        op === "gte"
          ? q.gte(column, Number(p[key]))
          : op === "lte"
            ? q.lte(column, Number(p[key]))
            : q.eq(column, Number(p[key]));
  }
  if (p.sort === "price_asc" || p.sort === "price_desc")
    q = q.order("price", { ascending: p.sort === "price_asc" });
  else if (p.sort === "mileage")
    q = q.order("vehicles(mileage)", { ascending: true });
  else if (p.sort === "year")
    q = q.order("vehicles(year)", { ascending: false });
  else q = q.order("published_at", { ascending: false });
  const { data, error, count } = await q
    .order("id")
    .range((page - 1) * 12, page * 12 - 1);
  if (error) throw new Error("Catalogue indisponible");
  return {
    items: (data || []) as unknown as Listing[],
    count: count || 0,
    page,
  };
}
export async function listing(slug: string) {
  if (!configured) return null;
  const c = await db();
  const { data, error } = await c
    .from("vehicle_listings")
    .select("*,vehicles!inner(*,vehicle_images(id,position))")
    .eq("slug", slug)
    .eq("business_id", process.env.SALES_BUSINESS_ID!)
    .in("status", ["AVAILABLE", "RESERVED", "SOLD"])
    .maybeSingle();
  if (error) throw new Error("Annonce indisponible");
  return data as unknown as
    | (Listing & {
        vehicles: Listing["vehicles"] & {
          vehicle_images: { id: string; position: number }[];
        };
      })
    | null;
}
