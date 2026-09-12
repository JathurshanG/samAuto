import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/server";
import { configured } from "@/config/site";
export async function requireStaff() {
  if (!configured) redirect("/connexion?configuration=1");
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: members, error } = await client
    .from("business_members")
    .select("business_id,role")
    .eq("user_id", user.id);
  if (error || !members?.length) redirect("/connexion?acces=1");
  return { client, user, members };
}
