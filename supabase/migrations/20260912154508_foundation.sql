-- Single dealership, with explicitly separated workshop operator and staff memberships.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
create table public.businesses (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('SALES','WORKSHOP')),
 name text not null, phone text, whatsapp text, email text, address text, hours text,
 legal_text text, privacy_text text, workshop_operator_id uuid references public.businesses(id),
 services text[] not null default '{}', benefits text[] not null default '{}', is_demo boolean not null default false
);
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text not null default '');
create table public.business_members(business_id uuid references public.businesses(id),user_id uuid references auth.users(id) on delete cascade,role text not null check(role in ('OWNER','STAFF')),primary key(business_id,user_id));
create function private.member(b uuid, owner_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.business_members m where m.business_id=b and m.user_id=auth.uid() and (not owner_only or m.role='OWNER'));
$$;
revoke all on function private.member(uuid,boolean) from public;
grant execute on function private.member(uuid,boolean) to authenticated,service_role;
create table public.business_settings(business_id uuid primary key references public.businesses(id), retention_days integer not null default 1095 check(retention_days between 30 and 3650), analytics_enabled boolean not null default false);
create table public.customers(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),first_name text not null,last_name text not null,email text,phone text,postal_code text,marketing_consent boolean not null default false,created_at timestamptz not null default now(),unique(id,business_id));
create index customers_search on public.customers(business_id,lower(email));
create index customers_phone on public.customers(business_id,phone);
create table public.vehicles(
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),make text not null,model text not null,version text not null default '',year integer not null check(year between 1900 and 2100),mileage integer not null check(mileage>=0),fuel text not null,transmission text not null,body text not null default '',color text not null default '',power integer,fiscal_power integer,engine_cc integer,doors integer,seats integer,first_registration date,description text not null default '',equipment text[] not null default '{}',created_at timestamptz not null default now(),unique(id,business_id)
);
create table public.vehicle_private(vehicle_id uuid primary key,business_id uuid not null,vin text,registration text,internal_reference text,purchase_price numeric(12,2) check(purchase_price>=0),internal_costs numeric(12,2) not null default 0 check(internal_costs>=0),foreign key(vehicle_id,business_id) references public.vehicles(id,business_id) on delete cascade);
create table public.vehicle_listings(
 id uuid primary key default gen_random_uuid(),vehicle_id uuid not null,business_id uuid not null,slug text unique not null,price numeric(12,2) not null check(price>0),status text not null default 'DRAFT' check(status in ('AVAILABLE','RESERVED','SOLD','DRAFT','ARCHIVED')),warranty text,published_at timestamptz,created_at timestamptz not null default now(),foreign key(vehicle_id,business_id) references public.vehicles(id,business_id) on delete cascade,unique(id,business_id)
);
create unique index one_active_listing on public.vehicle_listings(vehicle_id) where status in ('DRAFT','AVAILABLE','RESERVED');
create index catalogue on public.vehicle_listings(business_id,status,published_at desc);
create index vehicle_filters on public.vehicles(make,model,year,mileage);
create table public.vehicle_images(id uuid primary key default gen_random_uuid(),vehicle_id uuid not null,business_id uuid not null,storage_path text unique not null,position integer not null default 0,foreign key(vehicle_id,business_id) references public.vehicles(id,business_id) on delete cascade);
create table public.features(id uuid primary key default gen_random_uuid(),label text unique not null);
create table public.vehicle_features(vehicle_id uuid references public.vehicles(id) on delete cascade,feature_id uuid references public.features(id),primary key(vehicle_id,feature_id));
create table public.vehicle_price_history(id uuid primary key default gen_random_uuid(),listing_id uuid not null,business_id uuid not null,price numeric(12,2) not null,created_at timestamptz not null default now(),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id) on delete cascade);
create table public.leads(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),customer_id uuid,listing_id uuid,first_name text not null,last_name text not null,email text not null,phone text not null,message text not null default '',source text not null default 'WEBSITE' check(source in ('WEBSITE','PHONE','WHATSAPP','TRADE_IN','WORKSHOP','OTHER','LEBONCOIN','LA_CENTRALE','AUTOSCOUT24','GOOGLE','FACEBOOK','INSTAGRAM')),status text not null default 'NEW' check(status in ('NEW','CONTACTED','APPOINTMENT','NEGOTIATION','WON','LOST')),assigned_to uuid references auth.users(id),details jsonb not null default '{}',marketing_consent boolean not null default false,privacy_acknowledged_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(customer_id,business_id) references public.customers(id,business_id),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id),unique(id,business_id));
create index leads_inbox on public.leads(business_id,status,created_at desc);
create table public.trade_in_requests(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),customer_id uuid,listing_id uuid,first_name text not null,last_name text not null,email text not null,phone text not null,message text not null default '',source text not null default 'WEBSITE' check(source in ('WEBSITE','PHONE','WHATSAPP','TRADE_IN','WORKSHOP','OTHER','LEBONCOIN','LA_CENTRALE','AUTOSCOUT24','GOOGLE','FACEBOOK','INSTAGRAM')),status text not null default 'NEW' check(status in ('NEW','CONTACTED','PROPOSAL','ACCEPTED','REJECTED','CLOSED')),assigned_to uuid references auth.users(id),details jsonb not null default '{}',marketing_consent boolean not null default false,privacy_acknowledged_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(customer_id,business_id) references public.customers(id,business_id),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id),unique(id,business_id));
create index trade_in_requests_inbox on public.trade_in_requests(business_id,status,created_at desc);
create table public.appointments(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),customer_id uuid,listing_id uuid,first_name text not null,last_name text not null,email text not null,phone text not null,message text not null default '',source text not null default 'WEBSITE' check(source in ('WEBSITE','PHONE','WHATSAPP','TRADE_IN','WORKSHOP','OTHER','LEBONCOIN','LA_CENTRALE','AUTOSCOUT24','GOOGLE','FACEBOOK','INSTAGRAM')),status text not null default 'NEW' check(status in ('NEW','CONTACTED','CONFIRMED','COMPLETED','CANCELLED')),assigned_to uuid references auth.users(id),details jsonb not null default '{}',marketing_consent boolean not null default false,privacy_acknowledged_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(customer_id,business_id) references public.customers(id,business_id),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id),unique(id,business_id));
create index appointments_inbox on public.appointments(business_id,status,created_at desc);
create table public.workshop_requests(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),customer_id uuid,listing_id uuid,first_name text not null,last_name text not null,email text not null,phone text not null,message text not null default '',source text not null default 'WEBSITE' check(source in ('WEBSITE','PHONE','WHATSAPP','TRADE_IN','WORKSHOP','OTHER','LEBONCOIN','LA_CENTRALE','AUTOSCOUT24','GOOGLE','FACEBOOK','INSTAGRAM')),status text not null default 'NEW' check(status in ('NEW','CONTACTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),assigned_to uuid references auth.users(id),details jsonb not null default '{}',marketing_consent boolean not null default false,privacy_acknowledged_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(customer_id,business_id) references public.customers(id,business_id),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id),unique(id,business_id));
create index workshop_requests_inbox on public.workshop_requests(business_id,status,created_at desc);
create table public.lead_notes(id uuid primary key default gen_random_uuid(),lead_id uuid not null,business_id uuid not null,body text not null check(length(body) between 1 and 4000),author_id uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),foreign key(lead_id,business_id) references public.leads(id,business_id) on delete cascade);
create table public.trade_in_images(id uuid primary key default gen_random_uuid(),request_id uuid not null,business_id uuid not null,storage_path text unique not null,foreign key(request_id,business_id) references public.trade_in_requests(id,business_id) on delete cascade);
create table public.customer_vehicles(id uuid primary key default gen_random_uuid(),business_id uuid not null,customer_id uuid not null,registration text,make text,model text,foreign key(customer_id,business_id) references public.customers(id,business_id));
create table public.customer_purchases(id uuid primary key default gen_random_uuid(),business_id uuid not null,customer_id uuid not null,listing_id uuid not null,purchased_at date not null,foreign key(customer_id,business_id) references public.customers(id,business_id),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id));
create table public.customer_reviews(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),author_name text not null,body text not null,rating integer not null check(rating between 1 and 5),source_url text,approved boolean not null default false,created_at timestamptz not null default now());
create table public.analytics_events(id bigint generated always as identity primary key,business_id uuid not null references public.businesses(id),listing_id uuid,event text not null check(event in ('VEHICLE_VIEW','PHONE_CLICK','WHATSAPP_CLICK','CONTACT_SUBMIT','TRADE_IN_SUBMIT','APPOINTMENT_SUBMIT','WORKSHOP_SUBMIT','FAVORITE')),created_at timestamptz not null default now(),foreign key(listing_id,business_id) references public.vehicle_listings(id,business_id));
create index analytics_by_event on public.analytics_events(business_id,event,created_at);
create table public.audit_logs(id bigint generated always as identity primary key,business_id uuid not null references public.businesses(id),actor_id uuid,table_name text not null,record_id uuid,action text not null,old_status text,new_status text,created_at timestamptz not null default now());
-- No names, messages, email, financial details or tokens in audit records.
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare row_data jsonb; begin
 row_data:=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 insert into public.audit_logs(business_id,actor_id,table_name,record_id,action,old_status,new_status) values((row_data->>'business_id')::uuid,auth.uid(),TG_TABLE_NAME,(row_data->>'id')::uuid,TG_OP,case when TG_OP<>'INSERT' then to_jsonb(old)->>'status' end,case when TG_OP<>'DELETE' then to_jsonb(new)->>'status' end);
 if TG_OP='DELETE' then return old;end if;return new;
end;$$;
revoke all on function private.audit_change() from public;
create function private.listing_rules() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if old.status='SOLD' then raise exception 'Archive sold listings instead of deleting';end if;return old;
 end if;
 if new.status in ('AVAILABLE','RESERVED') and not exists(select 1 from public.vehicle_images where vehicle_id=new.vehicle_id) then raise exception 'At least one photo is required';end if;
 if new.status in ('AVAILABLE','RESERVED','SOLD') and new.published_at is null then new.published_at:=now();end if;
 return new;
end;$$;
create trigger listing_rules before insert or update or delete on public.vehicle_listings for each row execute function private.listing_rules();
create function private.price_change() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' or old.price is distinct from new.price then insert into public.vehicle_price_history(listing_id,business_id,price) values(new.id,new.business_id,new.price);end if;return new;
end;$$;
create trigger price_change after insert or update on public.vehicle_listings for each row execute function private.price_change();
-- RLS: no public write access to leads, costs, clients or media.
alter table public.businesses enable row level security;
revoke all on public.businesses from anon,authenticated;
grant all on public.businesses to service_role;
alter table public.profiles enable row level security;
revoke all on public.profiles from anon,authenticated;
grant all on public.profiles to service_role;
alter table public.business_members enable row level security;
revoke all on public.business_members from anon,authenticated;
grant all on public.business_members to service_role;
alter table public.business_settings enable row level security;
revoke all on public.business_settings from anon,authenticated;
grant all on public.business_settings to service_role;
alter table public.customers enable row level security;
revoke all on public.customers from anon,authenticated;
grant all on public.customers to service_role;
alter table public.vehicles enable row level security;
revoke all on public.vehicles from anon,authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicle_private enable row level security;
revoke all on public.vehicle_private from anon,authenticated;
grant all on public.vehicle_private to service_role;
alter table public.vehicle_listings enable row level security;
revoke all on public.vehicle_listings from anon,authenticated;
grant all on public.vehicle_listings to service_role;
alter table public.vehicle_images enable row level security;
revoke all on public.vehicle_images from anon,authenticated;
grant all on public.vehicle_images to service_role;
alter table public.features enable row level security;
revoke all on public.features from anon,authenticated;
grant all on public.features to service_role;
alter table public.vehicle_features enable row level security;
revoke all on public.vehicle_features from anon,authenticated;
grant all on public.vehicle_features to service_role;
alter table public.vehicle_price_history enable row level security;
revoke all on public.vehicle_price_history from anon,authenticated;
grant all on public.vehicle_price_history to service_role;
alter table public.leads enable row level security;
revoke all on public.leads from anon,authenticated;
grant all on public.leads to service_role;
alter table public.lead_notes enable row level security;
revoke all on public.lead_notes from anon,authenticated;
grant all on public.lead_notes to service_role;
alter table public.trade_in_requests enable row level security;
revoke all on public.trade_in_requests from anon,authenticated;
grant all on public.trade_in_requests to service_role;
alter table public.trade_in_images enable row level security;
revoke all on public.trade_in_images from anon,authenticated;
grant all on public.trade_in_images to service_role;
alter table public.appointments enable row level security;
revoke all on public.appointments from anon,authenticated;
grant all on public.appointments to service_role;
alter table public.workshop_requests enable row level security;
revoke all on public.workshop_requests from anon,authenticated;
grant all on public.workshop_requests to service_role;
alter table public.customer_vehicles enable row level security;
revoke all on public.customer_vehicles from anon,authenticated;
grant all on public.customer_vehicles to service_role;
alter table public.customer_purchases enable row level security;
revoke all on public.customer_purchases from anon,authenticated;
grant all on public.customer_purchases to service_role;
alter table public.customer_reviews enable row level security;
revoke all on public.customer_reviews from anon,authenticated;
grant all on public.customer_reviews to service_role;
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon,authenticated;
grant all on public.analytics_events to service_role;
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon,authenticated;
grant all on public.audit_logs to service_role;
grant select on public.businesses,public.vehicles,public.vehicle_listings,public.vehicle_images,public.features,public.customer_reviews to anon,authenticated;
create policy business_public on public.businesses for select to anon,authenticated using (true);
grant update on public.businesses to authenticated;
create policy business_owner on public.businesses for update to authenticated using(private.member(id,true)) with check(private.member(id,true));
grant select on public.profiles,public.business_members to authenticated;
create policy self_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy self_membership on public.business_members for select to authenticated using(user_id=auth.uid());
create policy listings_public on public.vehicle_listings for select to anon,authenticated using(status in ('AVAILABLE','RESERVED','SOLD'));
create policy vehicles_public on public.vehicles for select to anon,authenticated using(exists(select 1 from public.vehicle_listings l where l.vehicle_id=vehicles.id and l.status in ('AVAILABLE','RESERVED','SOLD')));
create policy images_public on public.vehicle_images for select to anon,authenticated using(exists(select 1 from public.vehicle_listings l where l.vehicle_id=vehicle_images.vehicle_id and l.status in ('AVAILABLE','RESERVED','SOLD')));
create policy features_public on public.features for select to anon,authenticated using(true);
create policy reviews_public on public.customer_reviews for select to anon,authenticated using(approved);
grant select,insert,update,delete on public.business_settings to authenticated;
create policy staff on public.business_settings for all to authenticated using(private.member(business_id,true)) with check(private.member(business_id,true));
grant select,insert,update,delete on public.customers to authenticated;
create policy staff on public.customers for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.vehicles to authenticated;
create policy staff on public.vehicles for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.vehicle_private to authenticated;
create policy staff on public.vehicle_private for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.vehicle_listings to authenticated;
create policy staff on public.vehicle_listings for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.vehicle_images to authenticated;
create policy staff on public.vehicle_images for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.vehicle_price_history to authenticated;
create policy staff on public.vehicle_price_history for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.leads to authenticated;
create policy staff on public.leads for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.lead_notes to authenticated;
create policy staff on public.lead_notes for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.trade_in_requests to authenticated;
create policy staff on public.trade_in_requests for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.trade_in_images to authenticated;
create policy staff on public.trade_in_images for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.appointments to authenticated;
create policy staff on public.appointments for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.workshop_requests to authenticated;
create policy staff on public.workshop_requests for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.customer_vehicles to authenticated;
create policy staff on public.customer_vehicles for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.customer_purchases to authenticated;
create policy staff on public.customer_purchases for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select,insert,update,delete on public.customer_reviews to authenticated;
create policy staff on public.customer_reviews for all to authenticated using(private.member(business_id)) with check(private.member(business_id));
grant select on public.analytics_events to authenticated;
create policy staff_read on public.analytics_events for select to authenticated using(private.member(business_id));
grant select on public.audit_logs to authenticated;
create policy staff_read on public.audit_logs for select to authenticated using(private.member(business_id));
grant select,insert,update,delete on public.vehicle_features to authenticated;
create policy staff_features on public.vehicle_features for all to authenticated using(exists(select 1 from public.vehicles v where v.id=vehicle_id and private.member(v.business_id))) with check(exists(select 1 from public.vehicles v where v.id=vehicle_id and private.member(v.business_id)));
grant usage,select on all sequences in schema public to service_role;
create trigger audit_vehicles after insert or update or delete on public.vehicles for each row execute function private.audit_change();
create trigger audit_vehicle_listings after insert or update or delete on public.vehicle_listings for each row execute function private.audit_change();
create trigger audit_leads after insert or update or delete on public.leads for each row execute function private.audit_change();
create trigger audit_trade_in_requests after insert or update or delete on public.trade_in_requests for each row execute function private.audit_change();
create trigger audit_appointments after insert or update or delete on public.appointments for each row execute function private.audit_change();
create trigger audit_workshop_requests after insert or update or delete on public.workshop_requests for each row execute function private.audit_change();
-- Private bucket: public image route checks publication before streaming a file.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('vehicle-media','vehicle-media',false,8388608,array['image/jpeg','image/webp','image/png']),('trade-in-media','trade-in-media',false,8388608,array['image/jpeg','image/webp','image/png']);
create policy staff_storage on storage.objects for all to authenticated using(bucket_id in ('vehicle-media','trade-in-media') and private.member((storage.foldername(name))[1]::uuid)) with check(bucket_id in ('vehicle-media','trade-in-media') and private.member((storage.foldername(name))[1]::uuid));
-- Distributed rate limiting. Only server key can invoke; never store raw IPs.
create table private.rate_limits(key text primary key,hits integer not null,window_start timestamptz not null);
create function public.consume_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;begin
 insert into private.rate_limits as r(key,hits,window_start) values(p_key,1,now()) on conflict(key) do update set hits=case when r.window_start < now()-make_interval(secs=>p_seconds) then 1 else r.hits+1 end,window_start=case when r.window_start < now()-make_interval(secs=>p_seconds) then now() else r.window_start end returning hits into n;
 return n<=p_limit;
end;$$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
-- Atomic public intake: validates ownership/status again while locking the listing.
create function public.submit_request(p_kind text,p_business uuid,p_listing uuid,p_contact jsonb,p_details jsonb,p_message text,p_marketing boolean) returns uuid language plpgsql set search_path='' as $$
declare customer uuid;request_id uuid;table_name text;listing_status text;begin
 if p_kind not in ('contact','finance','appointment','trade-in','workshop') then raise exception 'Invalid kind';end if;
 if p_listing is not null then
 select status into listing_status from public.vehicle_listings where id=p_listing and business_id=p_business for share;
 if listing_status is distinct from 'AVAILABLE' then raise exception 'Vehicle is not available';end if;
 end if;
 if not exists(select 1 from public.businesses where id=p_business) then raise exception 'Unknown business';end if;
 -- Serialize identical contacts. No automatic merging across entities or on email alone.
 perform pg_advisory_xact_lock(hashtextextended(p_business::text||lower(p_contact->>'email')||(p_contact->>'phone'),0));
 select id into customer from public.customers where business_id=p_business and lower(email)=lower(p_contact->>'email') and phone=p_contact->>'phone' and lower(first_name)=lower(p_contact->>'first_name') and lower(last_name)=lower(p_contact->>'last_name') limit 1;
 if customer is null then insert into public.customers(business_id,first_name,last_name,email,phone,postal_code,marketing_consent) values(p_business,p_contact->>'first_name',p_contact->>'last_name',lower(p_contact->>'email'),p_contact->>'phone',p_contact->>'postal_code',p_marketing) returning id into customer;end if;
 table_name:=case p_kind when 'trade-in' then 'trade_in_requests' when 'appointment' then 'appointments' when 'workshop' then 'workshop_requests' else 'leads' end;
 execute format('insert into public.%I(business_id,customer_id,listing_id,first_name,last_name,email,phone,message,details,marketing_consent,source) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id',table_name) into request_id using p_business,customer,p_listing,p_contact->>'first_name',p_contact->>'last_name',p_contact->>'email',p_contact->>'phone',p_message,p_details||jsonb_build_object('kind',p_kind),p_marketing,case p_kind when 'trade-in' then 'TRADE_IN' when 'workshop' then 'WORKSHOP' else 'WEBSITE' end;
 return request_id;
end;$$;
revoke all on function public.submit_request(text,uuid,uuid,jsonb,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.submit_request(text,uuid,uuid,jsonb,jsonb,text,boolean) to service_role;
