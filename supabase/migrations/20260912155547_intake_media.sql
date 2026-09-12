create or replace function public.submit_request(p_kind text,p_business uuid,p_listing uuid,p_contact jsonb,p_details jsonb,p_message text,p_marketing boolean) returns uuid language plpgsql set search_path='' as $$
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
 execute format('insert into public.%I(business_id,customer_id,listing_id,first_name,last_name,email,phone,message,details,marketing_consent,source) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id',table_name) into request_id using p_business,customer,p_listing,p_contact->>'first_name',p_contact->>'last_name',p_contact->>'email',p_contact->>'phone',p_message,(p_details-'photo_paths'-'analytics_consent')||jsonb_build_object('kind',p_kind),p_marketing,case p_kind when 'trade-in' then 'TRADE_IN' when 'workshop' then 'WORKSHOP' else 'WEBSITE' end;
 if p_kind='trade-in' then
 insert into public.trade_in_images(request_id,business_id,storage_path) select request_id,p_business,value from jsonb_array_elements_text(coalesce(p_details->'photo_paths','[]'::jsonb));
 end if;
 if coalesce((p_details->>'analytics_consent')::boolean,false) and exists(select 1 from public.business_settings where business_id=p_business and analytics_enabled) then
 insert into public.analytics_events(business_id,listing_id,event) values(p_business,p_listing,case p_kind when 'trade-in' then 'TRADE_IN_SUBMIT' when 'appointment' then 'APPOINTMENT_SUBMIT' when 'workshop' then 'WORKSHOP_SUBMIT' else 'CONTACT_SUBMIT' end);
 end if;
 return request_id;
end;$$;
revoke all on function public.submit_request(text,uuid,uuid,jsonb,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.submit_request(text,uuid,uuid,jsonb,jsonb,text,boolean) to service_role;
