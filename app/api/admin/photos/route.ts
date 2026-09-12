import {readForm} from "@/lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/features/auth/session";
import { imageBytes } from "@/lib/uploads";
import { sameOrigin, failure } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client } = await requireStaff();
    const f = await readForm(request);
    const id = z.uuid().parse(f.get("vehicle_id"));
    const { data: v, error } = await client
      .from("vehicles")
      .select("business_id")
      .eq("id", id)
      .single();
    if (error || !v) throw Error("Forbidden");
    const files = f
      .getAll("photos")
      .filter((x): x is File => x instanceof File);
    if (
      !files.length ||
      files.length > 12 ||
      files.reduce((n, f) => n + f.size, 0) > 3 * 1024 * 1024
    )
      throw Error("Too large");
    const { data: existing } = await client
      .from("vehicle_images")
      .select("position")
      .eq("vehicle_id", id)
      .order("position", { ascending: false })
      .limit(1);
    let position = (existing?.[0]?.position ?? -1) + 1;
    for (const file of files) {
      const bytes = await imageBytes(file);
      const path = `${v.business_id}/${id}/${crypto.randomUUID()}.webp`;
      const { error: up } = await client.storage
        .from("vehicle-media")
        .upload(path, bytes, { contentType: "image/webp" });
      if (up) throw up;
      const { error: insert } = await client
        .from("vehicle_images")
        .insert({
          vehicle_id: id,
          business_id: v.business_id,
          storage_path: path,
          position: position++,
        });
      if (insert) {
        await client.storage.from("vehicle-media").remove([path]);
        throw insert;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { client } = await requireStaff();
    const raw = await request.json();
    if (raw.action === "REORDER") {
      const payload = z
        .object({ vehicle_id: z.uuid(), ids: z.array(z.uuid()).max(100) })
        .parse(raw);
      const { error } = await client.rpc("reorder_photos", {
        p_vehicle: payload.vehicle_id,
        p_ids: payload.ids,
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    const { id, action } = z
      .object({ id: z.uuid(), action: z.enum(["FIRST", "DELETE"]) })
      .parse(raw);
    const { data: im, error } = await client
      .from("vehicle_images")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !im) throw Error("Missing");
    if (action === "DELETE") {
      const { data: l } = await client
        .from("vehicle_listings")
        .select("id")
        .eq("vehicle_id", im.vehicle_id)
        .in("status", ["AVAILABLE", "RESERVED"]);
      const { count } = await client
        .from("vehicle_images")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", im.vehicle_id);
      if (l?.length && (count || 0) <= 1) throw Error("Keep public photo");
      const { error: e } = await client
        .from("vehicle_images")
        .delete()
        .eq("id", id);
      if (e) throw e;
      await client.storage.from("vehicle-media").remove([im.storage_path]);
    } else {
      const { data: first } = await client
        .from("vehicle_images")
        .select("position")
        .eq("vehicle_id", im.vehicle_id)
        .order("position")
        .limit(1);
      const { error: e } = await client
        .from("vehicle_images")
        .update({ position: (first?.[0]?.position || 0) - 1 })
        .eq("id", id);
      if (e) throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
