import "server-only";
import { createHmac } from "node:crypto";
import { privilegedDb } from "@/lib/supabase/server";
export async function rateLimit(request: Request, scope: string, limit = 5) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret) throw Error("Rate limit not configured");
  const ip = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      "unknown"
    : "shared-local";
  const key = createHmac("sha256", secret)
    .update(`${scope}:${ip}`)
    .digest("hex");
  const { data, error } = await privilegedDb().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_seconds: 600,
  });
  if (error || !data) throw Error("Rate limited");
}
