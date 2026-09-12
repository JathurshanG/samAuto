alter table public.vehicle_images add constraint scoped_vehicle_path check(storage_path like business_id::text||'/'||vehicle_id::text||'/%');
alter table public.trade_in_images add constraint scoped_trade_path check(storage_path like business_id::text||'/%');
create function private.image_delete_rules() returns trigger language plpgsql set search_path='' as $$
begin
 perform id from public.vehicles where id=old.vehicle_id for update;
 if exists(select 1 from public.vehicle_listings where vehicle_id=old.vehicle_id and status in ('AVAILABLE','RESERVED')) and (select count(*) from public.vehicle_images where vehicle_id=old.vehicle_id)<=1 then raise exception 'Keep one published photo';end if;return old;
end;$$;
create trigger image_delete_rules before delete on public.vehicle_images for each row execute function private.image_delete_rules();
create function public.reorder_photos(p_vehicle uuid,p_ids uuid[]) returns void language plpgsql set search_path='' as $$
declare b uuid;n integer;begin
 select business_id into b from public.vehicles where id=p_vehicle for update;
 if b is null or not private.member(b) then raise exception 'Forbidden';end if;
 select count(*) into n from public.vehicle_images where vehicle_id=p_vehicle;
 if n<>cardinality(p_ids) or n<>(select count(distinct id) from unnest(p_ids) id) or n<>(select count(*) from public.vehicle_images where vehicle_id=p_vehicle and id=any(p_ids)) then raise exception 'Photo set changed. Refresh';end if;
 update public.vehicle_images i set position=ordering.position::integer-1 from unnest(p_ids) with ordinality ordering(id,position) where i.id=ordering.id and i.vehicle_id=p_vehicle;
end;$$;
revoke all on function public.reorder_photos(uuid,uuid[]) from public,anon;
grant execute on function public.reorder_photos(uuid,uuid[]) to authenticated;
create or replace function private.listing_rules() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if old.status='SOLD' then raise exception 'Archive sold listings instead of deleting';end if;return old;
 end if;
 perform id from public.vehicles where id=new.vehicle_id for update;
 if new.status in ('AVAILABLE','RESERVED') and not exists(select 1 from public.vehicle_images where vehicle_id=new.vehicle_id) then raise exception 'At least one photo is required';end if;
 if new.status in ('AVAILABLE','RESERVED','SOLD') and new.published_at is null then new.published_at:=now();end if;
 return new;
end;$$;
