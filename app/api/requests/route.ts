import {readForm} from "@/lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
import { configured } from "@/config/site";
import { business, operator } from "@/services/public-data";
import { privilegedDb } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation";
import {
  tradeSchema,
  workshopSchema,
  appointmentSchema,
} from "@/features/leads/validation";
import { sameOrigin, failure } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { imageBytes } from "@/lib/uploads";
export async function POST(request: Request) {
  const uploaded: string[] = [];
  let committed = false;
  try {
    sameOrigin(request);
    if (!configured) return failure(null, 503);
    if (Number(request.headers.get("content-length") || 0) > 3500000)
      throw Error("Too large");
    await rateLimit(request, "intake");
    const form = await readForm(request);
    const raw = Object.fromEntries(form);
    const kind = z
      .enum(["contact", "finance", "trade-in", "appointment", "workshop"])
      .parse(raw.kind);
    const contact = contactSchema.parse(raw);
    const b = kind === "workshop" ? await operator() : await business();
    if (!b || !b.privacy_text || !b.legal_text)
      throw Error("Configure legal information first");
    let details: Record<string, unknown> = {};
    if (kind === "trade-in") details = tradeSchema.parse(raw);
    if (kind === "appointment") details = appointmentSchema.parse(raw);
    if (kind === "workshop") {
      details = workshopSchema.parse(raw);
      if (!b.services.includes(String(details.service)))
        throw Error("Service inactive");
    }
    const listing = raw.listing_id ? z.uuid().parse(raw.listing_id) : null;
    if (kind === "workshop" && listing) throw Error("Invalid listing");
    const c = privilegedDb();
    const files = form
      .getAll("photos")
      .filter((v): v is File => v instanceof File && v.size > 0);
    if (
      (kind !== "trade-in" && files.length) ||
      files.length > 8 ||
      files.reduce((n, f) => n + f.size, 0) > 3 * 1024 * 1024
    )
      throw Error("Too many photos");
    for (const file of files) {
      const bytes = await imageBytes(file);
      const path = `${b.id}/${crypto.randomUUID()}.webp`;
      const { error } = await c.storage
        .from("trade-in-media")
        .upload(path, bytes, { contentType: "image/webp" });
      if (error) throw error;
      uploaded.push(path);
    }
    details.photo_paths = uploaded;
    details.analytics_consent = form.get("analytics_consent") === "yes";
    const { data: id, error } = await c.rpc("submit_request", {
      p_kind: kind,
      p_business: b.id,
      p_listing: listing,
      p_contact: contact,
      p_details: details,
      p_message: contact.message,
      p_marketing: contact.marketing === "on",
    });
    if (error) throw error;
    committed = true;
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    if (uploaded.length && !committed)
      await privilegedDb().storage.from("trade-in-media").remove(uploaded);
    return failure(e);
  }
}
