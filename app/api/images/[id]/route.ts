import { db, privilegedDb } from "@/lib/supabase/server";
import { configured } from "@/config/site";
import { z } from "zod";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!configured) return new Response(null, { status: 404 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 404 });
  const c = await db();
  const { data } = await c
    .from("vehicle_images")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!data) return new Response(null, { status: 404 });
  try {
    const { data: blob, error } = await privilegedDb()
      .storage.from("vehicle-media")
      .download(data.storage_path);
    if (error || !blob) return new Response(null, { status: 404 });
    return new Response(blob, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
