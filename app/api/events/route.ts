import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin, failure } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { privilegedDb } from "@/lib/supabase/server";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "analytics", 80);
    const body = z
      .object({
        event: z.enum([
          "VEHICLE_VIEW",
          "PHONE_CLICK",
          "WHATSAPP_CLICK",
          "FAVORITE",
        ]),
        listing_id: z.uuid().optional(),
      })
      .parse(await request.json());
    const c = privilegedDb();
    const business = process.env.SALES_BUSINESS_ID!;
    const { data: s } = await c
      .from("business_settings")
      .select("analytics_enabled")
      .eq("business_id", business)
      .single();
    if (!s?.analytics_enabled) return new NextResponse(null, { status: 204 });
    if (body.listing_id) {
      const { data: l } = await c
        .from("vehicle_listings")
        .select("id")
        .eq("id", body.listing_id)
        .eq("business_id", business)
        .in("status", ["AVAILABLE", "RESERVED", "SOLD"])
        .maybeSingle();
      if (!l) throw Error("Unknown listing");
    }
    const { error } = await c
      .from("analytics_events")
      .insert({ ...body, business_id: business });
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return failure(e);
  }
}
