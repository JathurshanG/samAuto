import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/features/auth/session";
import { sameOrigin, failure } from "@/lib/http";
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { client, members } = await requireStaff();
    const { id } = z
      .object({ id: z.uuid(), confirmation: z.literal("EFFACER") })
      .parse(await request.json());
    const { data: c } = await client
      .from("customers")
      .select("business_id")
      .eq("id", id)
      .single();
    if (
      !c ||
      !members.some(
        (m) => m.business_id === c.business_id && m.role === "OWNER",
      )
    )
      throw Error("Owner required");
    const { data: requests, error: re } = await client
      .from("trade_in_requests")
      .select("id")
      .eq("customer_id", id);
    if (re) throw re;
    if (requests?.length) {
      const { data: photos, error: pe } = await client
        .from("trade_in_images")
        .select("storage_path")
        .in(
          "request_id",
          requests.map((r) => r.id),
        );
      if (pe) throw pe;
      if (photos?.length) {
        const { error } = await client.storage
          .from("trade-in-media")
          .remove(photos.map((p) => p.storage_path));
        if (error) throw error;
      }
    }
    const { error } = await client.rpc("anonymize_customer", { p_id: id });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
