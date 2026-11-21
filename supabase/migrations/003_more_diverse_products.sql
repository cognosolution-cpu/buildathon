-- VoicoCart Catalog Expansion Script (100% SAFE & IDEMPOTENT)
-- Adds 4 new product categories + 8 new products without altering existing tables, orders, or user data.
-- Copy and paste this entire script into your Supabase SQL Editor and click Run.

-- 1. Add 4 new categories safely (preserves all existing categories)
insert into public.categories (slug, name) values
  ('gaming', 'Gaming Gear'),
  ('workspace', 'Desk & Setup'),
  ('fitness', 'Fitness & Recovery'),
  ('travel', 'Travel Tech')
on conflict (slug) do update set name = excluded.name;

-- 2. Upsert 8 diverse products across the new categories (safe on conflict by slug)
insert into public.products (
  slug, title, brand, category_id, description, price, mrp, rating, rating_count, stock,
  image_url, model_preset, deal_label, specs, variants, tags
)
values
  (
    'vc-gamepad-apex',
    'Vortex Hall-Effect Pro Gamepad',
    'VibeLab',
    (select id from public.categories where slug = 'gaming'),
    'Zero-drift Hall-Effect magnetic thumbsticks, tactile micro-switch triggers, 1000Hz 2.4GHz wireless dongle, and warm copper trim.',
    3999, 5499, 4.9, 740, 22,
    '/src/assets/images/product_gaming_controller_1795243122415.jpg',
    'controller',
    'Esports Pro',
    '{"Sticks":"Hall-Effect Zero Drift","Polling":"1000Hz 2.4GHz + USB-C","Triggers":"2-Stage Hair-Trigger","Battery":"42 hrs Li-Po","Compatibility":"PC / Android / Switch","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#c85a17"},{"name":"Stealth Matte","hex":"#161618"}]'::jsonb,
    array['gamepad','controller','gaming','esports','joystick','pc gaming','wireless']
  ),
  (
    'vc-headset-nexus',
    'Nexus Spatial 2.4GHz Gaming Headset',
    'Aura Acoustics',
    (select id from public.categories where slug = 'gaming'),
    '50mm graphene gaming headset with ultra-low 18ms lossless 2.4GHz wireless, detachable broadcast mic, and cooling memory earcups.',
    4799, 6999, 4.7, 510, 16,
    '/src/assets/images/product_headphones_studio_1795037379361.jpg',
    'headphones',
    '31% Off',
    '{"Driver":"50mm Graphene Spatial","Latency":"18ms 2.4GHz Wireless","Battery":"60 hrs Continuous","Microphone":"AI Noise-Cancelling Boom","Weight":"275g Featherlight","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Obsidian Amber","hex":"#ff6a00"},{"name":"Graphite Black","hex":"#1e1f22"}]'::jsonb,
    array['headset','gaming','esports','wireless','mic','low latency','audio']
  ),
  (
    'vc-dock-thunder',
    'Forge TB4 Rotary Desk Dock',
    'VoltCore',
    (select id from public.categories where slug = 'workspace'),
    'CNC-milled 12-in-1 Thunderbolt 4 & USB-C workstation dock featuring dual 4K 60Hz output, 96W host charging, and machined copper volume dial.',
    7499, 9999, 4.8, 380, 13,
    '/src/assets/images/product_workspace_dock_1795243122469.jpg',
    'dock',
    '25% Off',
    '{"Ports":"12-in-1 TB4 + 2.5GbE","Display":"Dual 4K 60Hz / 8K 30Hz","PowerDelivery":"96W Laptop Pass-Through","Control":"Copper Rotary DAC Dial","Chassis":"Unibody CNC Aluminum","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#b85c27"},{"name":"Space Titanium","hex":"#54575c"}]'::jsonb,
    array['dock','hub','thunderbolt','usb-c','workspace','desk','setup','laptop']
  ),
  (
    'vc-desk-mat-arc',
    'ArcDock MagSafe Desk Console',
    'VoltCore',
    (select id from public.categories where slug = 'workspace'),
    'Weighted anodized desk charging console & USB hub combining a 15W Qi2 phone stand, SD 4.0 card reader, and warm ambient halo light.',
    3499, 4799, 4.6, 620, 20,
    '/src/assets/images/product_lamp_desk_1795193455811.jpg',
    'dock',
    'Studio Essential',
    '{"Wireless":"15W Qi2 Standby Stand","Reader":"UHS-II SD + microSD","Ports":"3x USB-C 10Gbps","Weight":"480g Anti-Slip Steel","Cable":"1.5m Braided USB-C","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Matte Obsidian","hex":"#141416"},{"name":"Warm Bronze","hex":"#a65e2e"}]'::jsonb,
    array['desk','workspace','setup','dock','hub','magsafe','charger','office']
  ),
  (
    'vc-recovery-pulse',
    'Kinetix Mini Recovery Gun',
    'ChronoFit',
    (select id from public.categories where slug = 'fitness'),
    'Whisper-quiet 38dB brushless pocket percussive muscle massager with 12kg stall force, 5 speeds, and 4 silicone recovery heads.',
    3699, 5499, 4.8, 1340, 26,
    '/src/assets/images/product_fitness_gun_1795243122555.jpg',
    'recovery',
    '33% Off',
    '{"Amplitude":"8mm Deep Tissue","Noise":"38dB Whisper Brushless","Battery":"4 hrs USB-C Fast Charge","Speeds":"1800-3200 RPM (5 Gears)","Weight":"440g Pocket Alloy","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#b85c27"},{"name":"Carbon Matte","hex":"#161618"}]'::jsonb,
    array['massage','massage gun','recovery','fitness','gym','workout','muscle','gift']
  ),
  (
    'vc-fitness-band',
    'ChronoCore Screenless Recovery Strap',
    'ChronoFit',
    (select id from public.categories where slug = 'fitness'),
    'Featherlight screenless biometric recovery band tracking HRV, strain, sleep stages, and VO2 recovery with 14-day continuous battery.',
    4499, 5999, 4.7, 540, 19,
    '/src/assets/images/product_smartwatch_pulse_1795037380625.jpg',
    'smartwatch',
    'Zero-Screen Focus',
    '{"Metrics":"HRV, SpO2, Strain, Sleep","Battery":"14 days Slide-On Charge","Water Resistance":"5ATM Swimproof","Weight":"22g Knit Strap","Sync":"Auto BLE 5.3 App Sync","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Weave","hex":"#1c1c1e"},{"name":"Ember Stripe","hex":"#d9601a"}]'::jsonb,
    array['fitness','recovery','band','tracker','sleep','hrv','workout','gym']
  ),
  (
    'vc-charger-gan140',
    'VoltCore 140W GaN Travel Brick',
    'VoltCore',
    (select id from public.categories where slug = 'travel'),
    'Ultra-compact 140W GaN PD 3.1 triple USB-C charger with real-time amber wattage OLED screen and snap-on EU/UK/IN travel plugs.',
    3299, 4999, 4.9, 1760, 34,
    '/src/assets/images/product_travel_gancharger_1795243121908.jpg',
    'charger',
    '34% Off',
    '{"Output":"140W PD 3.1 (3x USB-C)","Display":"Live Amber Wattage OLED","Technology":"GaN-III Cool Thermal","Plugs":"India + US/UK/EU Adapters","Weight":"215g Pocket Size","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#b85c27"},{"name":"Graphite Matte","hex":"#1a1a1d"}]'::jsonb,
    array['charger','gan','travel','adapter','140w','usb-c','laptop','fast charger']
  ),
  (
    'vc-travel-organizer',
    'Nomad Hard-Shell Tech Organizer',
    'StrideLab',
    (select id from public.categories where slug = 'travel'),
    'Compression-molded water-resistant flight tech pouch engineered to hold GaN bricks, SSDs, AirTags, cables, and pocket audio gear upright.',
    1799, 2699, 4.6, 890, 38,
    '/src/assets/images/product_bag_sling_1795193457665.jpg',
    'backpack',
    'Flight Ready',
    '{"Shell":"EVA Ripstop Water-Resistant","Layout":"180° Origami Pockets","Hardware":"Waterproof YKK Zippers","Slot":"Hidden Tracker Pocket","Weight":"260g Compact","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Stealth Black","hex":"#141416"},{"name":"Burnt Copper","hex":"#b85c27"}]'::jsonb,
    array['travel','organizer','pouch','bag','flight','carry','cables','budget']
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
