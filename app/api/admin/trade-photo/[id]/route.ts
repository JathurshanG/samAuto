import { requireStaff } from "@/features/auth/session";
import { z } from "zod";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client } = await requireStaff();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 404 });
  const { data: p } = await client
    .from("trade_in_images")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (!p) return new Response(null, { status: 404 });
  const { data: blob, error } = await client.storage
    .from("trade-in-media")
    .download(p.storage_path);
  if (error || !blob) return new Response(null, { status: 404 });
  return new Response(blob, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
