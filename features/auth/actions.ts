"use server";
import { db } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { configured } from "@/config/site";
export async function login(form: FormData) {
  if (!configured) redirect("/connexion?configuration=1");
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (email.length > 254 || password.length > 256)
    redirect("/connexion?erreur=1");
  const client = await db();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect("/connexion?erreur=1");
  redirect("/admin");
}
export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect("/connexion");
}
