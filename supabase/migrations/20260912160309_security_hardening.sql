-- Membership invariants are enforced even for direct Data API calls.
create function private.business_rules() returns trigger language plpgsql set search_path='' as $$
begin
 if auth.uid() is not null then
 if new.kind is distinct from old.kind or new.is_demo is distinct from old.is_demo or new.id is distinct from old.id then raise exception 'Immutable identity';end if;
 if new.workshop_operator_id is distinct from old.workshop_operator_id and new.workshop_operator_id is not null and not exists(select 1 from public.businesses where id=new.workshop_operator_id and kind='WORKSHOP' and private.member(id,true)) then raise exception 'Workshop owner permission required';end if;
 end if;
 return new;
end;$$;
create trigger business_rules before update on public.businesses for each row execute function private.business_rules();
-- Never allow an authenticated member to assign a note to a different author.
drop policy staff on public.lead_notes;
create policy notes_read on public.lead_notes for select to authenticated using(private.member(business_id));
create policy notes_insert on public.lead_notes for insert to authenticated with check(private.member(business_id) and author_id=auth.uid());
create policy notes_delete on public.lead_notes for delete to authenticated using(private.member(business_id,true));
-- Business ownership of objects cannot be reassigned via broad UPDATE policies.
create function private.immutable_business() returns trigger language plpgsql set search_path='' as $$
begin if new.business_id is distinct from old.business_id then raise exception 'Business reassignment forbidden';end if;return new;end;$$;
create trigger immutable_business before update on public.customers for each row execute function private.immutable_business();
create trigger immutable_business before update on public.vehicles for each row execute function private.immutable_business();
create trigger immutable_business before update on public.vehicle_private for each row execute function private.immutable_business();
create trigger immutable_business before update on public.vehicle_listings for each row execute function private.immutable_business();
create trigger immutable_business before update on public.vehicle_images for each row execute function private.immutable_business();
create trigger immutable_business before update on public.vehicle_price_history for each row execute function private.immutable_business();
create trigger immutable_business before update on public.leads for each row execute function private.immutable_business();
create trigger immutable_business before update on public.trade_in_requests for each row execute function private.immutable_business();
create trigger immutable_business before update on public.trade_in_images for each row execute function private.immutable_business();
create trigger immutable_business before update on public.appointments for each row execute function private.immutable_business();
create trigger immutable_business before update on public.workshop_requests for each row execute function private.immutable_business();
create trigger immutable_business before update on public.customer_vehicles for each row execute function private.immutable_business();
create trigger immutable_business before update on public.customer_purchases for each row execute function private.immutable_business();
