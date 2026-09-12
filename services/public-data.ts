import "server-only";
import { cache } from "react";
import { siteUrl, configured } from "@/config/site";
import { db } from "@/lib/supabase/server";
import type { Business, Listing } from "@/types/domain";
export const business = cache(async (): Promise<Business | null> => {
  if (!configured) return null;
  const c = await db();
  const { data, error } = await c
    .from("businesses")
    .select("*")
    .eq("id", process.env.SALES_BUSINESS_ID!)
    .single();
  if (error) throw new Error("Configuration de l’entreprise indisponible");
  if (
    data.is_demo &&
    !["localhost", "127.0.0.1"].includes(new URL(siteUrl).hostname)
  )
    throw new Error("Données fictives interdites sur un domaine public");
  return data;
});
export async function operator() {
  const b = await business();
  if (!b?.workshop_operator_id) return null;
  const c = await db();
  const { data, error } = await c
    .from("businesses")
    .select("*")
    .eq("id", b.workshop_operator_id)
    .single();
  if (error) throw new Error("Atelier indisponible");
  return data as Business;
}
export async function listings(): Promise<Listing[]> {
  if (!configured) return [];
  const c = await db();
  const { data, error } = await c
    .from("vehicle_listings")
    .select("*,vehicles!inner(*)")
    .eq("business_id", process.env.SALES_BUSINESS_ID!)
    .in("status", ["AVAILABLE", "RESERVED", "SOLD"])
    .order("published_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Catalogue indisponible");
  return data as Listing[];
}
