import { NextResponse } from "next/server";
import { siteUrl } from "@/config/site";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(siteUrl).origin)
    throw new Error("Origine de la demande refusée");
}
export function failure(error: unknown, status = 400) {
  const id = crypto.randomUUID();
  console.error(
    JSON.stringify({
      event: "request_failed",
      id,
      type: error instanceof Error ? error.name : "Unknown",
    }),
  );
  return NextResponse.json(
    {
      error:
        status === 503
          ? "Service non configuré ou indisponible."
          : "Demande refusée. Vérifiez les champs, vos droits et les conditions de publication.",
      reference: id,
    },
    { status },
  );
}

/** Bound multipart bodies even when Content-Length is absent or untrusted. */
export async function readForm(request: Request, maximum = 3500000) {
  if (Number(request.headers.get("content-length") || 0) > maximum) throw new Error("Body too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximum) { await reader.cancel(); throw new Error("Body too large"); }
    chunks.push(value);
  }
  return new Request("http://internal.invalid/form", { method: "POST", headers: { "Content-Type": request.headers.get("content-type") || "" }, body: Buffer.concat(chunks) }).formData();
}
