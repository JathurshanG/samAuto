import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
let db;
const sales = "11111111-1111-4111-8111-111111111111";
const workshop = "22222222-2222-4222-8222-222222222222";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
let lid, vid;
before(async () => {
  db = new PGlite();
  await db.waitReady;
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated,anon,service_role;grant execute on function auth.uid() to authenticated,anon,service_role;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
 grant usage on schema storage to authenticated;grant all on storage.objects to authenticated;
 `);
  for (const f of (await readdir("supabase/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(`supabase/migrations/${f}`, "utf8"));
  await db.exec(
    `insert into auth.users values('${owner}','owner@example.test');insert into public.businesses(id,kind,name) values('${sales}','SALES','Demo sales'),('${workshop}','WORKSHOP','Other operator');insert into public.business_members values('${sales}','${owner}','OWNER');insert into public.business_settings(business_id) values('${sales}'),('${workshop}');`,
  );
});
after(async () => {
  await db?.close();
});
async function as(role, uid = "") {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${uid}',false);`,
  );
}
const vehicle = {
  make: "Peugeot",
  model: "208",
  version: "Test",
  year: 2022,
  mileage: 12000,
  fuel: "Essence",
  transmission: "Manuelle",
  body: "Citadine",
  color: "Blanc",
  description: "Fictif",
  equipment: ["Climatisation"],
};
test("all exposed business tables have RLS enabled", async () => {
  const r = await db.query(
    "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r' and not relrowsecurity",
  );
  assert.equal(r.rows.length, 0);
});
test("owner creates and modifies vehicle atomically", async () => {
  await as("authenticated", owner);
  const r = await db.query(
    "select public.save_vehicle(null,$1,$2,$3,12000,'','peugeot-test') as id",
    [
      sales,
      JSON.stringify(vehicle),
      JSON.stringify({
        vin: "PRIVATE",
        purchase_price: 9000,
        internal_costs: 200,
      }),
    ],
  );
  lid = r.rows[0].id;
  const rows = await db.query(
    "select vehicle_id from vehicle_listings where id=$1",
    [lid],
  );
  vid = rows.rows[0].vehicle_id;
  await db.query("select public.save_vehicle($1,$2,$3,$4,13000,'','ignored')", [
    lid,
    sales,
    JSON.stringify({ ...vehicle, mileage: 14000 }),
    JSON.stringify({
      vin: "PRIVATE",
      purchase_price: 9000,
      internal_costs: 200,
    }),
  ]);
  const prices = await db.query(
    "select price from vehicle_price_history order by created_at",
  );
  assert.equal(prices.rows.length, 2);
});
test("publishing without a photo fails", async () => {
  await assert.rejects(
    db.query("update vehicle_listings set status='AVAILABLE' where id=$1", [
      lid,
    ]),
    /photo/,
  );
});
test("anon cannot read drafts, private costs, customers or submit RPC", async () => {
  await as("anon");
  assert.equal((await db.query("select * from vehicles")).rows.length, 0);
  assert.equal(
    (await db.query("select * from vehicle_listings")).rows.length,
    0,
  );
  await assert.rejects(db.query("select * from vehicle_private"), /permission/);
  await assert.rejects(db.query("select * from customers"), /permission/);
  await assert.rejects(
    db.query(
      "select public.submit_request('contact',$1,null,'{}','{}','',false)",
      [sales],
    ),
    /permission/,
  );
});
test("authenticated non-member cannot administer or self-promote", async () => {
  await as("authenticated", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.equal(
    (await db.query("select * from vehicle_private")).rows.length,
    0,
  );
  await assert.rejects(
    db.query("insert into business_members values($1,$2,'OWNER')", [
      sales,
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ]),
    /permission/,
  );
  await assert.rejects(
    db.query("select save_vehicle(null,$1,$2,$3,20000,'','attack')", [
      sales,
      JSON.stringify(vehicle),
      "{}",
    ]),
    /Forbidden/,
  );
});
test("publication exposes specs but never costs; media access follows publication", async () => {
  await as("authenticated", owner);
  await db.query(
    "insert into vehicle_images(vehicle_id,business_id,storage_path) values($1,$2,$3)",
    [vid, sales, `${sales}/${vid}/test.webp`],
  );
  await db.query("update vehicle_listings set status='AVAILABLE' where id=$1", [
    lid,
  ]);
  await as("anon");
  assert.equal((await db.query("select * from vehicles")).rows.length, 1);
  assert.equal((await db.query("select * from vehicle_images")).rows.length, 1);
  const columns = Object.keys(
    (await db.query("select * from vehicles")).rows[0],
  );
  assert.ok(!columns.includes("purchase_price"));
  assert.ok(!columns.includes("vin"));
});
test("intake creates customer and lead in same transaction; contacts dedupe only within business", async () => {
  await as("service_role");
  const contact = {
    first_name: "Fictif",
    last_name: "Test",
    email: "test@example.test",
    phone: "+33600000000",
  };
  for (let i = 0; i < 2; i++)
    await db.query(
      "select submit_request('contact',$1,$2,$3,'{}','Message',false)",
      [sales, lid, JSON.stringify(contact)],
    );
  assert.equal((await db.query("select * from customers")).rows.length, 1);
  assert.equal((await db.query("select * from leads")).rows.length, 2);
  await db.query(
    "select submit_request('workshop',$1,null,$2,'{}','Diagnostic',false)",
    [workshop, JSON.stringify(contact)],
  );
  assert.equal((await db.query("select * from customers")).rows.length, 2);
});
test("sales staff cannot read workshop customer or request", async () => {
  await as("authenticated", owner);
  assert.equal(
    (await db.query("select * from workshop_requests")).rows.length,
    0,
  );
  assert.equal((await db.query("select * from customers")).rows.length, 1);
});
test("cross-business foreign keys reject association", async () => {
  await as("service_role");
  const c = (
    await db.query("select id from customers where business_id=$1", [workshop])
  ).rows[0].id;
  await assert.rejects(
    db.query(
      "insert into leads(business_id,customer_id,first_name,last_name,email,phone) values($1,$2,'X','Y','x@example.test','0600000000')",
      [sales, c],
    ),
    /foreign key/,
  );
});
test("sold vehicle cannot receive a lead", async () => {
  await as("authenticated", owner);
  await db.query("update vehicle_listings set status='SOLD' where id=$1", [
    lid,
  ]);
  await as("service_role");
  await assert.rejects(
    db.query("select submit_request('contact',$1,$2,$3,'{}','Buy',false)", [
      sales,
      lid,
      JSON.stringify({
        first_name: "X",
        last_name: "Y",
        email: "x@example.test",
        phone: "0600000000",
      }),
    ]),
    /not available/,
  );
});
test("pipeline and notes update atomically; metrics are queryable", async () => {
  await as("authenticated", owner);
  const lead = (await db.query("select id from leads limit 1")).rows[0];
  await db.query(
    "select update_request('leads',$1,'CONTACTED',$2,'Called today')",
    [lead.id, owner],
  );
  assert.equal((await db.query("select * from lead_notes")).rows.length, 1);
  const r = await db.query("select business_metrics() as metrics");
  assert.equal(r.rows[0].metrics.leads, 2);
  assert.equal(r.rows[0].metrics.workshop, 0);
});
test("rate limiter is shared and has a hard threshold", async () => {
  await as("service_role");
  const first = await db.query("select consume_rate_limit('test',1,600) as ok");
  const second = await db.query(
    "select consume_rate_limit('test',1,600) as ok",
  );
  assert.equal(first.rows[0].ok, true);
  assert.equal(second.rows[0].ok, false);
});

test('private media paths cannot point outside their entity',async()=>{await as('authenticated',owner);await assert.rejects(db.query('insert into vehicle_images(vehicle_id,business_id,storage_path) values($1,$2,$3)',[vid,sales,`${workshop}/secret.webp`]),/scoped_vehicle_path/);});
test('photo reordering rejects duplicates and remains atomic',async()=>{await as('authenticated',owner);const ids=(await db.query('select id from vehicle_images where vehicle_id=$1',[vid])).rows.map(r=>r.id);await db.query('select reorder_photos($1,$2)',[vid,ids]);await assert.rejects(db.query('select reorder_photos($1,$2)',[vid,[...ids,...ids]]),/Photo set changed/);});
test('trade-in intake atomically records its private images',async()=>{await as('service_role');const r=await db.query("select submit_request('trade-in',$1,null,$2,$3,'Trade in',false) as id",[sales,JSON.stringify({first_name:'A',last_name:'B',email:'trade@example.test',phone:'0611111111'}),JSON.stringify({photo_paths:[`${sales}/test.webp`]})]);const photos=await db.query('select * from trade_in_images where request_id=$1',[r.rows[0].id]);assert.equal(photos.rows.length,1);const details=(await db.query('select details from trade_in_requests where id=$1',[r.rows[0].id])).rows[0].details;assert.ok(!('photo_paths' in details));});
test('owner can anonymize a customer without exposing workshop data',async()=>{await as('authenticated',owner);const c=(await db.query("select id from customers where email='test@example.test'")).rows[0];await db.query('select anonymize_customer($1)',[c.id]);const row=(await db.query('select * from customers where id=$1',[c.id])).rows[0];assert.equal(row.email,null);assert.equal(row.marketing_consent,false);assert.equal((await db.query('select * from lead_notes')).rows.length,0);});
test('development seed is executable and marks all ten vehicle listings as fictional',async()=>{await db.exec("reset role;select set_config('request.jwt.claim.sub','',false);");await db.exec(await readFile('supabase/seed.sql','utf8'));const r=await db.query("select count(*)::integer as n from vehicle_listings where business_id='d0000000-0000-4000-8000-000000000001'");assert.equal(r.rows[0].n,10);const b=await db.query("select is_demo from businesses where id='d0000000-0000-4000-8000-000000000001'");assert.equal(b.rows[0].is_demo,true);});
