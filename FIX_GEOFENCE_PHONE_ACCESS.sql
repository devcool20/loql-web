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
  v_device_allowance double precision;
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
  v_device_allowance := least(greatest(coalesce(p_accuracy_meters, 0), 150), 250);

  return query
  select (v_distance <= (v_radius + v_device_allowance)), v_distance, v_radius, v_society_id, v_society_name;
end;
$$;

create or replace function public.calibrate_my_society_geofence(
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_radius_meters integer default 500
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
  v_radius integer;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized to calibrate society geofence for this user';
  end if;

  select p.society_id into v_society_id
  from public.profiles p
  where p.id = p_user_id;

  if v_society_id is null then
    raise exception 'Your profile is not linked to a valid society yet.';
  end if;

  v_radius := least(greatest(coalesce(p_radius_meters, 500), 100), 500);

  update public.societies s
  set latitude = p_lat,
      longitude = p_lng,
      radius_meters = v_radius
  where s.id = v_society_id;

  return query
  select gf.allowed, gf.distance_meters, gf.radius_meters, gf.society_id, gf.society_name
  from public.check_geofence_access(p_user_id, p_lat, p_lng, 0) gf;
end;
$$;
