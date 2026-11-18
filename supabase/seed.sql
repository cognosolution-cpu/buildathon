-- Seed Categories & VibeCart Catalog into Supabase

insert into categories (slug, name) values
  ('audio', 'Audio'),
  ('wearables', 'Wearables'),
  ('smart-home', 'Smart Home'),
  ('footwear', 'Footwear'),
  ('peripherals', 'Peripherals')
on conflict (slug) do update set name = excluded.name;

insert into products (
  slug, title, brand, category_id, description, price, mrp, rating, rating_count, stock,
  image_url, model_preset, deal_label, specs, variants, tags
)
values
  (
    'vc-earbuds-air',
    'PulseBuds Air ANC',
    'Aura Acoustics',
    (select id from categories where slug = 'audio'),
    'Featherweight true wireless earbuds with 38dB hybrid noise cancellation, warm acoustic tuning, and 32-hour USB-C pocket charging case.',
    1799, 2999, 4.5, 1840, 24,
    '/src/assets/images/product_earbuds_obsidian_1795037379103.jpg',
    'earbuds',
    '40% Off',
    '{"Battery":"32 hrs total","Noise Control":"38dB Hybrid ANC","Water Resistance":"IPX5 Sweatproof","Driver":"11mm Titanium","Latency":"45ms Low Latency","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Copper","hex":"#1e1b18"},{"name":"Sunset Amber","hex":"#ff6a00"},{"name":"Titanium Slate","hex":"#63666a"}]'::jsonb,
    array['wireless','earbuds','anc','bluetooth','audio','tws','gift','waterproof']
  ),
  (
    'vc-earbuds-pro',
    'Obsidian Studio Pods Pro',
    'VibeLab',
    (select id from categories where slug = 'audio'),
    'Reference-grade dual-driver wireless earbuds with adaptive spatial audio, wireless Qi charging dock, and lossless LDAC codec support.',
    2899, 4499, 4.8, 920, 14,
    '/src/assets/images/product_earbuds_obsidian_1795037379103.jpg',
    'earbuds',
    'Top Rated',
    '{"Battery":"40 hrs total","Noise Control":"46dB Adaptive ANC","Water Resistance":"IPX6 Waterproof","Driver":"12mm Dual Coaxial","Latency":"38ms Gaming Mode","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Matte Obsidian","hex":"#141414"},{"name":"Burnished Gold","hex":"#d4822a"},{"name":"Graphite Silver","hex":"#7c8087"}]'::jsonb,
    array['wireless','earbuds','pro','anc','audio','tws','waterproof','ldac']
  ),
  (
    'vc-headphones-h1',
    'Aura Studio H1 Wireless',
    'Aura Acoustics',
    (select id from categories where slug = 'audio'),
    'Over-ear studio headphones crafted with anodized aluminum yokes, memory-foam leatherette cushions, and 55-hour playback.',
    6499, 8999, 4.9, 642, 9,
    '/src/assets/images/product_headphones_studio_1795037379361.jpg',
    'headphones',
    'Studio Flagship',
    '{"Battery":"55 hrs playback","Noise Control":"48dB Studio ANC","Water Resistance":"IPX4 Splash","Driver":"40mm Beryllium","Latency":"USB-C Lossless","Warranty":"2 Years"}'::jsonb,
    '[{"name":"Gunmetal Charcoal","hex":"#2b2d30"},{"name":"Warm Bronze","hex":"#a65e2e"},{"name":"Stealth Black","hex":"#101010"}]'::jsonb,
    array['headphones','over-ear','wireless','anc','studio','audio','music']
  ),
  (
    'vc-smartwatch-ti',
    'Chrono Pulse Titanium Watch',
    'ChronoFit',
    (select id from categories where slug = 'wearables'),
    'Circular AMOLED sapphire-glass smartwatch with dual-band GPS, continuous SpO2 & heart-rate sensors, and 10-day battery endurance.',
    4999, 7499, 4.6, 1210, 18,
    '/src/assets/images/product_smartwatch_pulse_1795037380625.jpg',
    'smartwatch',
    '33% Off',
    '{"Battery":"10 days","Display":"1.43\" AMOLED 1000nits","Water Resistance":"5ATM Swimproof","Chassis":"Grade-2 Titanium","Sensors":"ECG + Dual GPS","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Brushed Titanium","hex":"#7a756f"},{"name":"Midnight Black","hex":"#171717"},{"name":"Amber Band","hex":"#e36414"}]'::jsonb,
    array['watch','smartwatch','fitness','tracker','gift','mom','waterproof']
  ),
  (
    'vc-speaker-echo',
    'EchoCore 360 Acoustic',
    'Aura Acoustics',
    (select id from categories where slug = 'smart-home'),
    'Omnidirectional woven-fabric smart speaker with downward woofer, 4-mic far-field voice array, and ambient halo ring.',
    3499, 4999, 4.4, 530, 15,
    '/src/assets/images/product_speaker_acoustic_1795037380965.jpg',
    'speaker',
    null,
    '{"Output":"36W RMS 360°","Microphones":"4-Mic Far-Field","Connectivity":"Wi-Fi 6 + BT 5.3","Water Resistance":"IPX4 Desk Safe","Chassis":"Acoustic Knit","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Basalt Charcoal","hex":"#262626"},{"name":"Warm Ash","hex":"#524e4a"}]'::jsonb,
    array['speaker','smart speaker','bluetooth','home','audio','alexa','voice']
  ),
  (
    'vc-sneakers-veloce',
    'Veloce Carbon Road Runner',
    'StrideLab',
    (select id from categories where slug = 'footwear'),
    'Responsive daily marathon training shoes built with breathable engineered knit upper, nitrogen foam midsole, and sunset heel clip.',
    2799, 4299, 4.7, 2150, 32,
    '/src/assets/images/product_sneakers_runner_1795037381802.jpg',
    'sneakers',
    'Bestseller',
    '{"Weight":"228g (UK 8)","Midsole":"Nitro-Bounce Foam","Upper":"3D Aero Knit","Water Resistance":"DWR Coated","Drop":"8mm Heel-Toe","Warranty":"6 Months"}'::jsonb,
    '[{"name":"Obsidian Ember","hex":"#c85a17"},{"name":"Carbon Black","hex":"#19191b"},{"name":"Slate Mist","hex":"#60646b"}]'::jsonb,
    array['running','shoes','sneakers','footwear','sports','marathon']
  ),
  (
    'vc-keyboard-75',
    'KeyCraft 75 Tactile Wireless',
    'VibeLab',
    (select id from categories where slug = 'peripherals'),
    'Gasket-mounted 75% CNC aluminum wireless mechanical keyboard with hot-swap linear switches, PBT keycaps, and tri-mode pairing.',
    5999, 7999, 4.8, 410, 11,
    '/src/assets/images/product_keyboard_mech_1795037381618.jpg',
    'keyboard',
    null,
    '{"Battery":"4000mAh (180h)","Layout":"75% Compact (84 Keys)","Switches":"Hot-Swap Tactile","Connectivity":"2.4GHz / BT / USB-C","Chassis":"CNC Aluminum","Warranty":"1 Year"}'::jsonb,
    '[{"name":"Obsidian Amber","hex":"#232325"},{"name":"Graphite Mono","hex":"#44464a"}]'::jsonb,
    array['keyboard','mechanical','wireless','desk','gaming','work']
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
