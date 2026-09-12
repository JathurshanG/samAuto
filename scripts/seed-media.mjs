import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw Error("Demo media seed is restricted to local Supabase.");
const c = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: b, error } = await c
  .from("businesses")
  .select("id,is_demo")
  .eq("id", "d0000000-0000-4000-8000-000000000001")
  .single();
if (error || !b?.is_demo)
  throw Error("Run local migrations and demo seed first.");
const bytes = await sharp(
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><rect width="1200" height="750" fill="#dce3e8"/><text x="600" y="350" text-anchor="middle" font-family="sans-serif" font-size="44" fill="#243746">DÉMONSTRATION</text><text x="600" y="420" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#243746">Image de test · Aucun véhicule réel</text></svg>',
  ),
)
  .webp()
  .toBuffer();
const { data: images, error: ie } = await c
  .from("vehicle_images")
  .select("storage_path")
  .eq("business_id", b.id);
if (ie) throw ie;
for (const im of images) {
  const { error } = await c.storage
    .from("vehicle-media")
    .upload(im.storage_path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) throw error;
}
if (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD) {
  const { data, error } = await c.auth.admin.createUser({
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  const id = data.user.id;
  const { error: pe } = await c
    .from("profiles")
    .insert({ id, display_name: "Admin de test" });
  if (pe) throw pe;
  const { error: me } = await c
    .from("business_members")
    .insert(
      [b.id, "d0000000-0000-4000-8000-000000000002"].map((business_id) => ({
        business_id,
        user_id: id,
        role: "OWNER",
      })),
    );
  if (me) throw me;
}
console.log("Demo media uploaded. No credentials are printed.");
