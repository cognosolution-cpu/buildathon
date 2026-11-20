-- VibeCart Incremental Update Script (SAFE: does not drop or reset existing tables/orders)
-- Copy and paste this entire script into Supabase SQL Editor and click Run.

-- 1. Add missing personal info columns to public.profiles safely
alter table public.profiles
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Create database activity / auth logs table safely
create table if not exists public.user_activity_logs (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_activity_logs_user_idx
  on public.user_activity_logs (user_id, created_at desc);

alter table public.user_activity_logs enable row level security;

drop policy if exists "own activity logs read" on public.user_activity_logs;
create policy "own activity logs read" on public.user_activity_logs
  for select using (auth.uid() = user_id);

drop policy if exists "own activity logs insert" on public.user_activity_logs;
create policy "own activity logs insert" on public.user_activity_logs
  for insert with check (auth.uid() = user_id);

-- 3. Auto-sync Google / Email Sign-In users into public.profiles + log sign-up event
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
  derived_avatar text;
begin
  derived_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), '')
  );
  derived_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  insert into public.profiles (id, email, full_name, avatar_url, updated_at)
  values (new.id, new.email, derived_name, derived_avatar, now())
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.user_activity_logs (user_id, event_type, details)
  values (
    new.id,
    'user_created',
    jsonb_build_object(
      'email', new.email,
      'provider', coalesce(new.raw_app_meta_data->>'provider', 'email')
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill existing signed-in Google / Auth users into public.profiles safely
insert into public.profiles (id, email, full_name, avatar_url, updated_at)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  ),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  now()
from auth.users u
on conflict (id) do update set
  email = coalesce(excluded.email, public.profiles.email),
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  updated_at = now();

-- 5. Add new categories safely (keeps existing categories untouched)
insert into public.categories (slug, name) values
  ('cameras', 'Cameras'),
  ('eyewear', 'Smart Eyewear'),
  ('accessories', 'Tech Carry')
on conflict (slug) do update set name = excluded.name;

-- 6. Upsert 6 new distinct products safely (keeps all existing products & orders untouched)
insert into public.products (
  slug, title, brand, category_id, description, price, mrp, rating, rating_count, stock,
  image_url, model_preset, deal_label, specs, variants, tags
)
values
  (
    'vc-camera-pocket',
    'Lumixor 4K Pocket Action Cam',
    'Lumixor',
    (select id from public.categories where slug = 'cameras'),
    'Waterproof 4K 60fps pocket vlog and action camera with dual OLED touchscreens, HorizonLock stabilization, and magnetic quick mount.',
    8999, 11999, 4.8, 685, 12,
    '/src/assets/images/product_camera_action_1795193455405.jpg',
    'camera',
    '25% Off',
    '{"Video":"4K 60fps HDR","Stabilization":"HorizonLock 360","Water Resistance":"10m Waterproof","Display":"Dual OLED Touch","Battery":"140 mins Recording","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#1a1918"},{"name":"Titanium Matte","hex":"#5c5f66"}]'::jsonb,
    array['camera','action cam','vlog','4k','waterproof','travel','creator']
  ),
  (
    'vc-glasses-spectra',
    'Spectra AI Smart Glasses',
    'VibeLab',
    (select id from public.categories where slug = 'eyewear'),
    'Polarized open-ear audio smart sunglasses with dual beamforming microphones, hands-free voice assistant triggers, and UV400 lenses.',
    6999, 9499, 4.7, 412, 15,
    '/src/assets/images/product_glasses_smart_1795193457406.jpg',
    'glasses',
    'New Arrival',
    '{"Audio":"Open-Ear Directional","Lenses":"Polarized UV400","Microphones":"Dual Wind-Cancelling","Water Resistance":"IPX4 Sweatproof","Battery":"8 hrs Playback","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Matte Copper","hex":"#a65e2e"},{"name":"Obsidian Frame","hex":"#141416"}]'::jsonb,
    array['glasses','sunglasses','smart glasses','eyewear','voice','audio','travel']
  ),
  (
    'vc-powerbank-volt',
    'VoltCore MagSafe 10K Power Bank',
    'VoltCore',
    (select id from public.categories where slug = 'accessories'),
    'Anodized CNC aluminum 10,000mAh magnetic Qi2 wireless power bank with live amber OLED wattage readout and 30W USB-C PD.',
    2199, 3299, 4.6, 1530, 42,
    '/src/assets/images/product_powerbank_mag_1795193456801.jpg',
    'powerbank',
    '33% Off',
    '{"Capacity":"10,000mAh High-Density","Wireless":"15W Qi2 MagSafe","Wired":"30W USB-C PD","Display":"Amber OLED Meter","Chassis":"CNC Anodized Alloy","Warranty":"18 Months"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#1e1b18"},{"name":"Sunset Amber","hex":"#d9601a"}]'::jsonb,
    array['powerbank','power bank','magsafe','charger','battery','travel','gift']
  ),
  (
    'vc-lamp-arcbeam',
    'ArcBeam Halo Desk Light Bar',
    'Aura Acoustics',
    (select id from public.categories where slug = 'smart-home'),
    'Zero-glare asymmetric monitor and desk light bar with precision wireless rotary dimmer puck and tunable 2700K-6500K ambient lighting.',
    2999, 4299, 4.7, 790, 21,
    '/src/assets/images/product_lamp_desk_1795193455811.jpg',
    'lamp',
    '30% Off',
    '{"Optics":"Asymmetric Anti-Glare","ColorTemp":"2700K-6500K Ra95","Control":"Wireless Rotary Puck","Power":"USB-C 10W","Chassis":"Brushed Aluminum","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Matte","hex":"#171719"},{"name":"Warm Bronze","hex":"#9e592b"}]'::jsonb,
    array['lamp','light bar','desk light','monitor','smart home','setup','work']
  ),
  (
    'vc-bag-nomad',
    'Nomad Tech Sling Backpack',
    'StrideLab',
    (select id from public.categories where slug = 'accessories'),
    '1680D ballistic nylon weatherproof commuter tech sling bag with padded 11-inch tablet sleeve, Fidlock magnetic buckle, and USB-C pass-through.',
    3299, 4999, 4.8, 940, 27,
    '/src/assets/images/product_bag_sling_1795193457665.jpg',
    'backpack',
    '34% Off',
    '{"Material":"1680D Ballistic Nylon","Capacity":"9L Organized Carry","Hardware":"Anodized Alloy Buckle","Water Resistance":"YKK AquaGuard Zippers","DeviceFit":"Up to 11\" Tablet","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Carbon Orange","hex":"#c85a17"},{"name":"Stealth Black","hex":"#151517"}]'::jsonb,
    array['bag','sling','backpack','carry','commute','travel','waterproof']
  ),
  (
    'vc-mouse-glidepro',
    'GlidePro Magnesium Wireless Mouse',
    'VibeLab',
    (select id from public.categories where slug = 'peripherals'),
    'Ultralight 52g perforated magnesium-alloy esports wireless mouse featuring a 26,000 DPI optical sensor, copper scroll wheel, and 4000Hz wireless dongle.',
    2699, 3999, 4.8, 1080, 25,
    '/src/assets/images/product_mouse_esports_1795193459046.jpg',
    'mouse',
    '33% Off',
    '{"Weight":"52g Magnesium Shell","Sensor":"PAW3395 26K DPI","Polling":"4000Hz Wireless","Battery":"80 hrs USB-C","Switches":"Optical Micro 90M","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#b85c27"},{"name":"Stealth Matte","hex":"#141416"}]'::jsonb,
    array['mouse','gaming','wireless','esports','lightweight','desk','work']
  )
on conflict (slug) do update set
  title = excluded.title,
  brand = excluded.brand,
  category_id = excluded.category_id,
  description = excluded.description,
  price = excluded.price,
  mrp = excluded.mrp,
  rating = excluded.rating,
  rating_count = excluded.rating_count,
  stock = excluded.stock,
  image_url = excluded.image_url,
  model_preset = excluded.model_preset,
  deal_label = excluded.deal_label,
  specs = excluded.specs,
  variants = excluded.variants,
  tags = excluded.tags;
