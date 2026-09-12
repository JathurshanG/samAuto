create function public.update_request(p_table text,p_id uuid,p_status text,p_assigned uuid,p_note text) returns void language plpgsql set search_path='' as $$
declare b uuid;begin
 if p_table not in ('leads','trade_in_requests','appointments','workshop_requests') then raise exception 'Invalid domain';end if;
 execute format('select business_id from public.%I where id=$1 for update',p_table) into b using p_id;
 if b is null or not private.member(b) then raise exception 'Forbidden';end if;
 if p_assigned is not null and not exists(select 1 from public.business_members where business_id=b and user_id=p_assigned) then raise exception 'Invalid assignee';end if;
 execute format('update public.%I set status=$1,assigned_to=$2,updated_at=now() where id=$3',p_table) using p_status,p_assigned,p_id;
 if length(trim(p_note))>0 then
 if p_table<>'leads' then raise exception 'Notes only on leads';end if;
 insert into public.lead_notes(lead_id,business_id,body) values(p_id,b,trim(p_note));end if;
end;$$;
revoke all on function public.update_request(text,uuid,text,uuid,text) from public,anon;
grant execute on function public.update_request(text,uuid,text,uuid,text) to authenticated;
create function public.save_settings(p_id uuid,p_values jsonb,p_retention integer,p_analytics boolean) returns void language plpgsql set search_path='' as $$
declare b public.businesses;operator uuid;begin
 if not private.member(p_id,true) then raise exception 'Owner required';end if;
 b:=jsonb_populate_record(null::public.businesses,p_values);
 if p_values ? 'workshop_operator_id' then
 operator:=(p_values->>'workshop_operator_id')::uuid;
 if operator is not null and not exists(select 1 from public.businesses where id=operator and kind='WORKSHOP' and private.member(id,true)) then raise exception 'Invalid workshop';end if;
 update public.businesses set workshop_operator_id=operator where id=p_id and kind='SALES';end if;
 update public.businesses set name=b.name,phone=b.phone,whatsapp=b.whatsapp,email=b.email,address=b.address,hours=b.hours,benefits=b.benefits,services=b.services,legal_text=b.legal_text,privacy_text=b.privacy_text where id=p_id;
 insert into public.business_settings(business_id,retention_days,analytics_enabled) values(p_id,p_retention,p_analytics) on conflict(business_id) do update set retention_days=excluded.retention_days,analytics_enabled=excluded.analytics_enabled;
end;$$;
revoke all on function public.save_settings(uuid,jsonb,integer,boolean) from public,anon;
grant execute on function public.save_settings(uuid,jsonb,integer,boolean) to authenticated;
create function public.search_customers(p_query text) returns setof public.customers language sql stable set search_path='' as $$
 select c.* from public.customers c where p_query='' or concat_ws(' ',c.first_name,c.last_name,c.email,c.phone) ilike '%'||left(p_query,80)||'%' or exists(select 1 from public.customer_vehicles v where v.customer_id=c.id and v.registration ilike '%'||left(p_query,80)||'%') order by c.created_at desc limit 100;
$$;
revoke all on function public.search_customers(text) from public,anon;
grant execute on function public.search_customers(text) to authenticated;
create function public.anonymize_customer(p_id uuid) returns void language plpgsql set search_path='' as $$
declare b uuid;t text;begin
 select business_id into b from public.customers where id=p_id for update;
 if b is null or not private.member(b,true) then raise exception 'Owner required';end if;
 delete from public.lead_notes where lead_id in(select id from public.leads where customer_id=p_id);
 delete from public.trade_in_images where request_id in(select id from public.trade_in_requests where customer_id=p_id);
 foreach t in array array['leads','trade_in_requests','appointments','workshop_requests'] loop
 execute format('update public.%I set first_name=$1,last_name=$1,email=$2,phone=$2,message=$2,details=$3,marketing_consent=false where customer_id=$4',t) using 'Anonyme','','{}'::jsonb,p_id;
 end loop;
 delete from public.customer_vehicles where customer_id=p_id;
 update public.customers set first_name='Anonyme',last_name='Anonyme',email=null,phone=null,postal_code=null,marketing_consent=false where id=p_id;
end;$$;
revoke all on function public.anonymize_customer(uuid) from public,anon;
grant execute on function public.anonymize_customer(uuid) to authenticated;
create function public.business_metrics() returns jsonb language sql stable set search_path='' as $$
select jsonb_build_object(
 'views',(select count(*) from public.analytics_events where event='VEHICLE_VIEW' and created_at>now()-interval '30 days'),
 'leads',(select count(*) from public.leads where created_at>now()-interval '30 days'),
 'workshop',(select count(*) from public.workshop_requests where created_at>now()-interval '30 days'),
 'top',coalesce((select jsonb_agg(x) from (select v.make||' '||v.model as name,count(e.id) as views,(select count(*) from public.leads ld where ld.listing_id=l.id and ld.created_at>now()-interval '30 days') as leads from public.vehicle_listings l join public.vehicles v on v.id=l.vehicle_id join public.analytics_events e on e.listing_id=l.id and e.event='VEHICLE_VIEW' and e.created_at>now()-interval '30 days' where private.member(l.business_id) group by l.id,v.make,v.model order by views desc limit 10) x),'[]'::jsonb),
 'sources',coalesce((select jsonb_agg(x) from(select source,count(*) as count from public.leads where created_at>now()-interval '30 days' group by source) x),'[]'::jsonb),
 'aging',coalesce((select jsonb_agg(x) from(select v.make||' '||v.model as name,floor(extract(epoch from(now()-l.published_at))/86400)::integer as days from public.vehicle_listings l join public.vehicles v on v.id=l.vehicle_id where private.member(l.business_id) and l.status in ('AVAILABLE','RESERVED') and l.published_at<now()-interval '60 days' order by l.published_at limit 50) x),'[]'::jsonb),
 'retention_due',(select count(*) from public.customers c join public.business_settings s on s.business_id=c.business_id where c.email is not null and c.created_at<now()-make_interval(days=>s.retention_days) and not exists(select 1 from public.leads l where l.customer_id=c.id and l.updated_at>now()-make_interval(days=>s.retention_days)) and not exists(select 1 from public.workshop_requests w where w.customer_id=c.id and w.updated_at>now()-make_interval(days=>s.retention_days))))
$$;
revoke all on function public.business_metrics() from public,anon;
grant execute on function public.business_metrics() to authenticated;
