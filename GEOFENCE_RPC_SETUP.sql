-- Geofencing primitives + strict 500m enforcement RPCs
-- Run in Supabase SQL editor
-- GPS readings can drift by tens of meters. The fence remains 500m, but checks
-- allow a capped accuracy buffer up to 100m to prevent false blocks during testing.

alter table public.societies
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists radius_meters integer default 500;

alter table public.items
  add column if not exists society_id uuid references public.societies(id),
  add column if not exists market_price numeric default 0;

create or replace function public.haversine_distance_meters(
  p_lat1 double precision,
  p_lng1 double precision,
  p_lat2 double precision,
  p_lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(
    sqrt(
      power(sin(radians((p_lat2 - p_lat1) / 2)), 2) +
      cos(radians(p_lat1)) * cos(radians(p_lat2)) *
      power(sin(radians((p_lng2 - p_lng1) / 2)), 2)
    )
  );
$$;

create or replace function public.check_geofence_access(
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_accuracy_meters double precision default 0
)
returns table(
  allowed boolean,
  distance_meters double precision,
  radius_meters integer,
  society_id uuid,
  society_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_society_id uuid;
  v_society_name text;
  v_lat double precision;
  v_lng double precision;
  v_radius integer;
  v_distance double precision;
  v_accuracy_allowance double precision;
begin
  select p.society_id into v_society_id
  from public.profiles p
  where p.id = p_user_id;

  if v_society_id is null then
    return query select false, null::double precision, 500, null::uuid, null::text;
    return;
  end if;

  select s.name, s.latitude::double precision, s.longitude::double precision, coalesce(s.radius_meters, 500)
  into v_society_name, v_lat, v_lng, v_radius
  from public.societies s
  where s.id = v_society_id;

  if v_lat is null or v_lng is null then
    return query select false, null::double precision, v_radius, v_society_id, v_society_name;
    return;
  end if;

  v_distance := public.haversine_distance_meters(p_lat, p_lng, v_lat, v_lng);
  v_accuracy_allowance := least(greatest(coalesce(p_accuracy_meters, 0), 0), 100);
  return query select (v_distance <= (v_radius + v_accuracy_allowance)), v_distance, v_radius, v_society_id, v_society_name;
end;
$$;

grant execute on function public.check_geofence_access(uuid, double precision, double precision, double precision) to authenticated;

create or replace function public.get_feed_items_geofenced(
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_accuracy_meters double precision default 0
)
returns setof public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access record;
begin
  select * into v_access from public.check_geofence_access(p_user_id, p_lat, p_lng, p_accuracy_meters);
  if not coalesce(v_access.allowed, false) then
    return;
  end if;

  return query
  select i.*
  from public.items i
  where i.society_id = v_access.society_id
    and coalesce(i.status, 'available') <> 'rented'
  order by i.created_at desc;
end;
$$;

grant execute on function public.get_feed_items_geofenced(uuid, double precision, double precision, double precision) to authenticated;

create or replace function public.create_item_geofenced(
  p_owner_id uuid,
  p_title text,
  p_description text,
  p_daily_rate numeric,
  p_category text,
  p_images text[],
  p_market_price numeric,
  p_lat double precision,
  p_lng double precision,
  p_accuracy_meters double precision default 0
)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access record;
  v_item public.items;
begin
  if auth.uid() is distinct from p_owner_id then
    raise exception 'Not authorized to list for this user';
  end if;

  select * into v_access from public.check_geofence_access(p_owner_id, p_lat, p_lng, p_accuracy_meters);
  if not coalesce(v_access.allowed, false) then
    raise exception 'You are outside your society''s 500m verified zone.';
  end if;

  insert into public.items(
    owner_id, society_id, title, description, daily_rate, category, images, market_price, status
  )
  values(
    p_owner_id,
    v_access.society_id,
    p_title,
    coalesce(p_description, ''),
    p_daily_rate,
    p_category,
    coalesce(p_images, array[]::text[]),
    coalesce(p_market_price, 0),
    'available'
  )
  returning * into v_item;

  return v_item;
end;
$$;

grant execute on function public.create_item_geofenced(uuid, text, text, numeric, text, text[], numeric, double precision, double precision, double precision) to authenticated;

create or replace function public.create_offer_geofenced(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_item_id uuid,
  p_offered_price numeric,
  p_duration_hours integer,
  p_lat double precision,
  p_lng double precision,
  p_accuracy_meters double precision default 0
)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access record;
  v_item public.items;
  v_sender_society uuid;
  v_offer public.offers;
begin
  if auth.uid() is distinct from p_sender_id then
    raise exception 'Not authorized to create offer for this user';
  end if;

  select * into v_access from public.check_geofence_access(p_sender_id, p_lat, p_lng, p_accuracy_meters);
  if not coalesce(v_access.allowed, false) then
    raise exception 'You are outside your society''s 500m verified zone.';
  end if;

  select * into v_item from public.items where id = p_item_id;
  if v_item.id is null then
    raise exception 'Item not found';
  end if;

  if coalesce(v_item.status, 'available') = 'rented' then
    raise exception 'Item is not available for rent';
  end if;

  select society_id into v_sender_society from public.profiles where id = p_sender_id;
  if v_sender_society is distinct from v_item.society_id then
    raise exception 'Item is outside your society scope';
  end if;

  insert into public.offers(
    item_id, sender_id, receiver_id, offered_price, duration_hours, status
  )
  values(
    p_item_id, p_sender_id, p_receiver_id, p_offered_price, p_duration_hours, 'pending'
  )
  returning * into v_offer;

  return v_offer;
end;
$$;

grant execute on function public.create_offer_geofenced(uuid, uuid, uuid, numeric, integer, double precision, double precision, double precision) to authenticated;
