-- Invoker functions: atomic writes under the caller's actual RLS policies.
create function public.save_vehicle(p_id uuid,p_business uuid,p_vehicle jsonb,p_private jsonb,p_price numeric,p_warranty text,p_slug text) returns uuid language plpgsql set search_path='' as $$
declare v public.vehicles; hidden public.vehicle_private; vid uuid; lid uuid;begin
 if not private.member(p_business) then raise exception 'Forbidden';end if;
 if not exists(select 1 from public.businesses where id=p_business and kind='SALES') then raise exception 'Sales business required';end if;
 v:=jsonb_populate_record(null::public.vehicles,p_vehicle);hidden:=jsonb_populate_record(null::public.vehicle_private,p_private);
 if p_id is null then
 insert into public.vehicles(business_id,make,model,version,year,mileage,fuel,transmission,body,color,power,fiscal_power,engine_cc,doors,seats,first_registration,description,equipment) values(p_business,v.make,v.model,v.version,v.year,v.mileage,v.fuel,v.transmission,v.body,v.color,v.power,v.fiscal_power,v.engine_cc,v.doors,v.seats,v.first_registration,v.description,v.equipment) returning id into vid;
 insert into public.vehicle_listings(vehicle_id,business_id,slug,price,warranty) values(vid,p_business,p_slug,p_price,p_warranty) returning id into lid;
 else
 select id,vehicle_id into lid,vid from public.vehicle_listings where id=p_id and business_id=p_business for update;
 if lid is null then raise exception 'Not found';end if;
 update public.vehicles set make=v.make,model=v.model,version=v.version,year=v.year,mileage=v.mileage,fuel=v.fuel,transmission=v.transmission,body=v.body,color=v.color,power=v.power,fiscal_power=v.fiscal_power,engine_cc=v.engine_cc,doors=v.doors,seats=v.seats,first_registration=v.first_registration,description=v.description,equipment=v.equipment where id=vid;
 update public.vehicle_listings set price=p_price,warranty=p_warranty where id=lid;
 end if;
 insert into public.vehicle_private(vehicle_id,business_id,vin,registration,internal_reference,purchase_price,internal_costs) values(vid,p_business,hidden.vin,hidden.registration,hidden.internal_reference,hidden.purchase_price,hidden.internal_costs) on conflict(vehicle_id) do update set vin=excluded.vin,registration=excluded.registration,internal_reference=excluded.internal_reference,purchase_price=excluded.purchase_price,internal_costs=excluded.internal_costs;
 return lid;
end;$$;
revoke all on function public.save_vehicle(uuid,uuid,jsonb,jsonb,numeric,text,text) from public,anon;
grant execute on function public.save_vehicle(uuid,uuid,jsonb,jsonb,numeric,text,text) to authenticated;
create function public.duplicate_vehicle(p_listing uuid) returns uuid language plpgsql set search_path='' as $$
declare v public.vehicles;l public.vehicle_listings;result uuid;begin
 select * into l from public.vehicle_listings where id=p_listing;
 if l.id is null or not private.member(l.business_id) then raise exception 'Forbidden';end if;
 select * into v from public.vehicles where id=l.vehicle_id;
 result:=public.save_vehicle(null,l.business_id,to_jsonb(v),jsonb_build_object('internal_costs',0),l.price,l.warranty,l.slug||'-copie-'||substr(gen_random_uuid()::text,1,8));
 return result;
end;$$;
revoke all on function public.duplicate_vehicle(uuid) from public,anon;
grant execute on function public.duplicate_vehicle(uuid) to authenticated;
