import {readForm} from "@/lib/http";
import { NextResponse } from "next/server";
import { requireStaff } from "@/features/auth/session";
import { vehicleSchema, slugify, listingStatuses } from "@/lib/validation";
import { failure, sameOrigin } from "@/lib/http";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, members } = await requireStaff();
    const f = await readForm(request);
    const v = vehicleSchema.parse(Object.fromEntries(f));
    const business = z.uuid().parse(f.get("business_id"));
    if (!members.some((m) => m.business_id === business))
      throw Error("Forbidden");
    const { data: b } = await client
      .from("businesses")
      .select("kind")
      .eq("id", business)
      .single();
    if (b?.kind !== "SALES") throw Error("Sales only");
    const id = f.get("id") ? z.uuid().parse(f.get("id")) : null;
    const {
      price,
      warranty,
      vin,
      registration,
      internal_reference,
      purchase_price,
      internal_costs,
      ...vehicle
    } = v;
    // Transactional RPC runs with caller RLS, never service role.
    const { data, error } = await client.rpc("save_vehicle", {
      p_id: id,
      p_business: business,
      p_vehicle: vehicle,
      p_private: {
        vin,
        registration,
        internal_reference,
        purchase_price,
        internal_costs,
      },
      p_price: price,
      p_warranty: warranty,
      p_slug: slugify(
        `${v.make}-${v.model}-${v.version}-${v.year}-${crypto.randomUUID().slice(0, 8)}`,
      ),
    });
    if (error) throw error;
    revalidatePath("/vehicules");
    return NextResponse.json({ id: data });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { client, members } = await requireStaff();
    const { id, action } = z
      .object({
        id: z.uuid(),
        action: z.enum([...listingStatuses, "DELETE", "DUPLICATE"]),
      })
      .parse(await request.json());
    const { data: l, error: le } = await client
      .from("vehicle_listings")
      .select("*")
      .eq("id", id)
      .single();
    if (le || !l) throw Error("Missing");
    if (!members.some((m) => m.business_id === l.business_id))
      throw Error("Forbidden");
    if (action === "DUPLICATE") {
      const { data, error } = await client.rpc("duplicate_vehicle", {
        p_listing: id,
      });
      if (error) throw error;
      return NextResponse.json({ id: data });
    }
    if (action === "DELETE") {
      if (l.status !== "DRAFT") throw Error("Archive first");
      const { error } = await client
        .from("vehicle_listings")
        .delete()
        .eq("id", id)
        .eq("status", "DRAFT");
      if (error) throw error;
    } else {
      const { error } = await client
        .from("vehicle_listings")
        .update({ status: action })
        .eq("id", id);
      if (error) throw error;
    }
    revalidatePath("/vehicules");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
