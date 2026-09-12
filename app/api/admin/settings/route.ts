import {readForm} from "@/lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/features/auth/session";
import { sameOrigin, failure } from "@/lib/http";
import { revalidatePath } from "next/cache";
const optional = z.string().trim().max(1000);
const phone = z.union([z.literal(""), z.string().regex(/^[+0-9(). -]{6,25}$/)]);
const lines = z
  .string()
  .max(4000)
  .transform((v) =>
    v
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
  );
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, members } = await requireStaff();
    const f = Object.fromEntries(await readForm(request));
    const data = z
      .object({
        id: z.uuid(),
        name: z.string().trim().min(1).max(150),
        phone,
        whatsapp: phone,
        email: z.union([z.literal(""), z.email()]),
        address: optional,
        hours: optional,
        benefits: lines,
        services: lines,
        legal_text: z.string().trim().max(30000),
        privacy_text: z.string().trim().max(30000),
        workshop_operator_id: z.union([z.uuid(), z.literal("")]).optional(),
        retention_days: z.coerce.number().int().min(30).max(3650),
        analytics_enabled: z.string().optional(),
      })
      .parse(f);
    if (!members.some((m) => m.business_id === data.id && m.role === "OWNER"))
      throw Error("Owner required");
    const {
      id,
      retention_days,
      analytics_enabled,
      workshop_operator_id,
      ...values
    } = data;
    if (
      workshop_operator_id &&
      !members.some(
        (m) => m.business_id === workshop_operator_id && m.role === "OWNER",
      )
    )
      throw Error("Operator permission required");
    const { error } = await client.rpc("save_settings", {
      p_id: id,
      p_values: {
        ...values,
        ...(workshop_operator_id !== undefined
          ? { workshop_operator_id: workshop_operator_id || null }
          : {}),
      },
      p_retention: retention_days,
      p_analytics: analytics_enabled === "on",
    });
    if (error) throw error;
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
