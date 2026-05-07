-- Test seed: West Pratap Nagar (Mathura) with strict 500m geofence
-- Run this in Supabase SQL Editor with an admin/service role session.

begin;

-- 1) Ensure society exists (idempotent by name, no unique index required)
do $$
declare
  v_society_id uuid;
begin
  select id into v_society_id
  from public.societies
  where name = 'West Pratap Nagar'
  order by created_at asc
  limit 1;

  if v_society_id is null then
    insert into public.societies (id, name, latitude, longitude, radius_meters)
    values (gen_random_uuid(), 'West Pratap Nagar', 27.4924, 77.6737, 500);
  else
    update public.societies
    set
      latitude = 27.4924,
      longitude = 77.6737,
      radius_meters = 500
    where id = v_society_id;
  end if;
end $$;

-- 2) Link test users by full_name (adjust if your names differ)
update public.profiles
set society_id = (
  select id from public.societies where name = 'West Pratap Nagar' limit 1
)
where full_name in ('Dev', 'dev2');

-- 3) Verify setup
select id, name, latitude, longitude, radius_meters
from public.societies
where name = 'West Pratap Nagar';

select id, full_name, email, society_id
from public.profiles
where full_name in ('Dev', 'dev2');

commit;
