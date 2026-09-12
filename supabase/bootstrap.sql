-- Execute AFTER migrations, on your chosen project. Replace placeholders first.
-- Create the first user via Supabase Auth dashboard (invite). Disable public signups.
begin;
insert into public.businesses(id,kind,name) values ('11111111-1111-4111-8111-111111111111','SALES','Nom de votre entreprise');
insert into public.business_settings(business_id) values('11111111-1111-4111-8111-111111111111');
-- Replace email; this intentionally fails if no matching auth user exists.
do $$ declare u uuid;begin
 select id into u from auth.users where email='REMPLACER_PAR_EMAIL_ADMIN';
 if u is null then raise exception 'Create admin Auth user and replace email first';end if;
 insert into public.profiles(id,display_name) values(u,'Administrateur') on conflict do nothing;
 insert into public.business_members(business_id,user_id,role) values('11111111-1111-4111-8111-111111111111',u,'OWNER');
end;$$;
commit;
-- Set SALES_BUSINESS_ID to the sales UUID above. Workshop: create a separate WORKSHOP
-- business and its settings/members, then link workshop_operator_id from sales settings.
