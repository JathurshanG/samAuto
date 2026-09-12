import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/features/auth/session";
import { isSection, sections } from "@/features/leads/pipeline";
import { failure, sameOrigin } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { client } = await requireStaff();
    const body = z
      .object({
        id: z.uuid(),
        section: z.string(),
        status: z.string(),
        assigned_to: z.uuid().nullable(),
        note: z.string().trim().max(4000),
      })
      .parse(await request.json());
    if (!isSection(body.section)) throw Error("Unknown domain");
    const cfg = sections[body.section];
    if (!(cfg.states as readonly string[]).includes(body.status))
      throw Error("Invalid status");
    const { error } = await client.rpc("update_request", {
      p_table: cfg.table,
      p_id: body.id,
      p_status: body.status,
      p_assigned: body.assigned_to,
      p_note: body.note,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
