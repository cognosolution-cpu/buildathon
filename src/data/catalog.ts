import type { Product } from '../types.ts';

export const HERO_IMAGE = '/src/assets/images/hero_vibecart_acoustic_1795037378526.jpg';

export const HOME_FEATURED_IDS = [
  'vc-earbuds-air',
  'vc-camera-pocket',
  'vc-glasses-spectra',
  'vc-gamepad-apex',
  'vc-dock-thunder',
  'vc-charger-gan140',
] as const;

export const CATALOG: Product[] = [
  {
    id: 'vc-earbuds-air',
    title: 'PulseBuds Air ANC',
    brand: 'Aura Acoustics',
    category: 'audio',
    categoryLabel: 'Audio',
    description:
      'Featherweight true wireless earbuds with 38dB hybrid noise cancellation, warm acoustic tuning, and 32-hour USB-C pocket charging case.',
    price: 1799,
    mrp: 2999,
    rating: 4.5,
    ratingCount: 1840,
    stock: 24,
    imageUrl: '/src/assets/images/product_earbuds_obsidian_1795037379103.jpg',
    modelPreset: 'earbuds',
    dealLabel: '40% Off',
    specs: {
      Battery: '32 hrs total',
      'Noise Control': '38dB Hybrid ANC',
      'Water Resistance': 'IPX5 Sweatproof',
      Driver: '11mm Titanium',
      Latency: '45ms Low Latency',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#1e1b18' },
      { name: 'Sunset Amber', hex: '#ff6a00' },
      { name: 'Titanium Slate', hex: '#63666a' },
    ],
    tags: ['wireless', 'earbuds', 'anc', 'bluetooth', 'audio', 'tws', 'gift', 'waterproof'],
  },
  {
    id: 'vc-earbuds-pro',
    title: 'Obsidian Studio Pods Pro',
    brand: 'VibeLab',
    category: 'audio',
    categoryLabel: 'Audio',
    description:
      'Reference-grade dual-driver wireless earbuds with adaptive spatial audio, wireless Qi charging dock, and lossless LDAC codec support.',
    price: 2899,
    mrp: 4499,
    rating: 4.8,
    ratingCount: 920,
    stock: 14,
    imageUrl: '/src/assets/images/product_earbuds_obsidian_1795037379103.jpg',
    modelPreset: 'earbuds',
    dealLabel: 'Top Rated',
    specs: {
      Battery: '40 hrs total',
      'Noise Control': '46dB Adaptive ANC',
      'Water Resistance': 'IPX6 Waterproof',
      Driver: '12mm Dual Coaxial',
      Latency: '38ms Gaming Mode',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Matte Obsidian', hex: '#141414' },
      { name: 'Burnished Gold', hex: '#d4822a' },
      { name: 'Graphite Silver', hex: '#7c8087' },
    ],
    tags: ['wireless', 'earbuds', 'pro', 'anc', 'audio', 'tws', 'waterproof', 'ldac'],
  },
  {
    id: 'vc-headphones-h1',
    title: 'Aura Studio H1 Wireless',
    brand: 'Aura Acoustics',
    category: 'audio',
    categoryLabel: 'Audio',
    description:
      'Over-ear studio headphones crafted with anodized aluminum yokes, memory-foam leatherette cushions, and 55-hour playback.',
    price: 6499,
    mrp: 8999,
    rating: 4.9,
    ratingCount: 642,
    stock: 9,
    imageUrl: '/src/assets/images/product_headphones_studio_1795037379361.jpg',
    modelPreset: 'headphones',
    dealLabel: 'Studio Flagship',
    specs: {
      Battery: '55 hrs playback',
      'Noise Control': '48dB Studio ANC',
      'Water Resistance': 'IPX4 Splash',
      Driver: '40mm Beryllium',
      Latency: 'USB-C Lossless',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Gunmetal Charcoal', hex: '#2b2d30' },
      { name: 'Warm Bronze', hex: '#a65e2e' },
      { name: 'Stealth Black', hex: '#101010' },
    ],
    tags: ['headphones', 'over-ear', 'wireless', 'anc', 'studio', 'audio', 'music'],
  },
  {
    id: 'vc-smartwatch-ti',
    title: 'Chrono Pulse Titanium Watch',
    brand: 'ChronoFit',
    category: 'wearables',
    categoryLabel: 'Wearables',
    description:
      'Circular AMOLED sapphire-glass smartwatch with dual-band GPS, continuous SpO2 & heart-rate sensors, and 10-day battery endurance.',
    price: 4999,
    mrp: 7499,
    rating: 4.6,
    ratingCount: 1210,
    stock: 18,
    imageUrl: '/src/assets/images/product_smartwatch_pulse_1795037380625.jpg',
    modelPreset: 'smartwatch',
    dealLabel: '33% Off',
    specs: {
      Battery: '10 days',
      Display: '1.43" AMOLED 1000nits',
      'Water Resistance': '5ATM Swimproof',
      Chassis: 'Grade-2 Titanium',
      Sensors: 'ECG + Dual GPS',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Brushed Titanium', hex: '#7a756f' },
      { name: 'Midnight Black', hex: '#171717' },
      { name: 'Amber Band', hex: '#e36414' },
    ],
    tags: ['watch', 'smartwatch', 'fitness', 'tracker', 'gift', 'mom', 'waterproof'],
  },
  {
    id: 'vc-speaker-echo',
    title: 'EchoCore 360 Acoustic',
    brand: 'Aura Acoustics',
    category: 'smart-home',
    categoryLabel: 'Smart Home',
    description:
      'Omnidirectional woven-fabric smart speaker with downward woofer, 4-mic far-field voice array, and ambient halo ring.',
    price: 3499,
    mrp: 4999,
    rating: 4.4,
    ratingCount: 530,
    stock: 15,
    imageUrl: '/src/assets/images/product_speaker_acoustic_1795037380965.jpg',
    modelPreset: 'speaker',
    specs: {
      Output: '36W RMS 360°',
      Microphones: '4-Mic Far-Field',
      Connectivity: 'Wi-Fi 6 + BT 5.3',
      'Water Resistance': 'IPX4 Desk Safe',
      Chassis: 'Acoustic Knit',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Basalt Charcoal', hex: '#262626' },
      { name: 'Warm Ash', hex: '#524e4a' },
    ],
    tags: ['speaker', 'smart speaker', 'bluetooth', 'home', 'audio', 'alexa', 'voice'],
  },
  {
    id: 'vc-sneakers-veloce',
    title: 'Veloce Carbon Road Runner',
    brand: 'StrideLab',
    category: 'footwear',
    categoryLabel: 'Footwear',
    description:
      'Responsive daily marathon training shoes built with breathable engineered knit upper, nitrogen foam midsole, and sunset heel clip.',
    price: 2799,
    mrp: 4299,
    rating: 4.7,
    ratingCount: 2150,
    stock: 32,
    imageUrl: '/src/assets/images/product_sneakers_runner_1795037381802.jpg',
    modelPreset: 'sneakers',
    dealLabel: 'Bestseller',
    specs: {
      Weight: '228g (UK 8)',
      Midsole: 'Nitro-Bounce Foam',
      Upper: '3D Aero Knit',
      'Water Resistance': 'DWR Coated',
      Drop: '8mm Heel-Toe',
      Warranty: '6 Months',
    },
    variants: [
      { name: 'Obsidian Ember', hex: '#c85a17' },
      { name: 'Carbon Black', hex: '#19191b' },
      { name: 'Slate Mist', hex: '#60646b' },
    ],
    tags: ['running', 'shoes', 'sneakers', 'footwear', 'sports', 'marathon'],
  },
  {
    id: 'vc-keyboard-75',
    title: 'KeyCraft 75 Tactile Wireless',
    brand: 'VibeLab',
    category: 'peripherals',
    categoryLabel: 'Peripherals',
    description:
      'Gasket-mounted 75% CNC aluminum wireless mechanical keyboard with hot-swap linear switches, PBT keycaps, and tri-mode pairing.',
    price: 5999,
    mrp: 7999,
    rating: 4.8,
    ratingCount: 410,
    stock: 11,
    imageUrl: '/src/assets/images/product_keyboard_mech_1795037381618.jpg',
    modelPreset: 'keyboard',
    specs: {
      Battery: '4000mAh (180h)',
      Layout: '75% Compact (84 Keys)',
      Switches: 'Hot-Swap Tactile',
      Connectivity: '2.4GHz / BT / USB-C',
      Chassis: 'CNC Aluminum',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Amber', hex: '#232325' },
      { name: 'Graphite Mono', hex: '#44464a' },
    ],
    tags: ['keyboard', 'mechanical', 'wireless', 'desk', 'gaming', 'work'],
  },
  {
    id: 'vc-headphones-lite',
    title: 'Aura Bass R2 Wireless',
    brand: 'Aura Acoustics',
    category: 'audio',
    categoryLabel: 'Audio',
    description:
      'Foldable travel ANC headphones with punchy 40mm dynamic drivers, fast 10-minute USB-C boost, and dual-device Bluetooth 5.4.',
    price: 2499,
    mrp: 3999,
    rating: 4.6,
    ratingCount: 1120,
    stock: 22,
    imageUrl: '/src/assets/images/product_headphones_studio_1795037379361.jpg',
    modelPreset: 'headphones',
    dealLabel: '38% Off',
    specs: {
      Battery: '45 hrs playback',
      'Noise Control': '35dB Travel ANC',
      'Water Resistance': 'IPX4 Splash',
      Driver: '40mm Dynamic',
      Latency: '50ms Low Latency',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Midnight Matte', hex: '#141416' },
      { name: 'Copper Slate', hex: '#b45c2a' },
      { name: 'Steel Silver', hex: '#787c82' },
    ],
    tags: ['headphones', 'wireless', 'anc', 'bass', 'travel', 'audio', 'music'],
  },
  {
    id: 'vc-watch-fit',
    title: 'ChronoFit Active AMOLED',
    brand: 'ChronoFit',
    category: 'wearables',
    categoryLabel: 'Wearables',
    description:
      'Slim everyday AMOLED fitness smartwatch with Bluetooth calling, 120+ workout modes, sleep staging, and 12-day battery life.',
    price: 2499,
    mrp: 3999,
    rating: 4.5,
    ratingCount: 2480,
    stock: 29,
    imageUrl: '/src/assets/images/product_smartwatch_pulse_1795037380625.jpg',
    modelPreset: 'smartwatch',
    dealLabel: '37% Off',
    specs: {
      Battery: '12 days',
      Display: '1.38" AMOLED 800nits',
      'Water Resistance': 'IP68 Dust & Water',
      Chassis: 'Anodized Alloy',
      Sensors: 'SpO2 + HR + Sleep',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Rose Copper', hex: '#c8714a' },
      { name: 'Obsidian Black', hex: '#151517' },
      { name: 'Warm Sand', hex: '#8f8478' },
    ],
    tags: ['watch', 'smartwatch', 'fitness', 'gift', 'mom', 'calling', 'waterproof'],
  },
  {
    id: 'vc-watch-apex',
    title: 'Chrono Apex Solar Pro',
    brand: 'ChronoFit',
    category: 'wearables',
    categoryLabel: 'Wearables',
    description:
      'Expedition-grade sapphire solar smartwatch with dual-band L1+L5 GPS, offline topographic routes, and 18-day endurance.',
    price: 7999,
    mrp: 10999,
    rating: 4.9,
    ratingCount: 390,
    stock: 8,
    imageUrl: '/src/assets/images/product_smartwatch_pulse_1795037380625.jpg',
    modelPreset: 'smartwatch',
    dealLabel: 'Endurance Pro',
    specs: {
      Battery: '18 days (Solar)',
      Display: '1.45" Sapphire AMOLED',
      'Water Resistance': '10ATM Dive Ready',
      Chassis: 'Forged Titanium',
      Sensors: 'Dual GPS + Altimeter',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Titanium Orange', hex: '#e35d14' },
      { name: 'Stealth Carbon', hex: '#1b1c1e' },
    ],
    tags: ['watch', 'smartwatch', 'gps', 'solar', 'pro', 'fitness', 'waterproof'],
  },
  {
    id: 'vc-speaker-mini',
    title: 'EchoCore Mini Go',
    brand: 'Aura Acoustics',
    category: 'smart-home',
    categoryLabel: 'Smart Home',
    description:
      'Pocket-sized IPX7 waterproof smart speaker with passive bass radiator, stereo pairing, and 16-hour USB-C battery.',
    price: 1499,
    mrp: 2499,
    rating: 4.5,
    ratingCount: 1620,
    stock: 35,
    imageUrl: '/src/assets/images/product_speaker_acoustic_1795037380965.jpg',
    modelPreset: 'speaker',
    dealLabel: '40% Off',
    specs: {
      Output: '12W RMS Punchy Bass',
      Microphones: '2-Mic Voice Pickup',
      Connectivity: 'BT 5.3 + Stereo Link',
      'Water Resistance': 'IPX7 Waterproof',
      Battery: '16 hrs USB-C',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Sunset Copper', hex: '#d9601a' },
      { name: 'Charcoal Knit', hex: '#252528' },
    ],
    tags: ['speaker', 'portable', 'bluetooth', 'mini', 'waterproof', 'gift', 'audio'],
  },
  {
    id: 'vc-speaker-studio',
    title: 'VibeSound Max Spatial Hub',
    brand: 'VibeLab',
    category: 'smart-home',
    categoryLabel: 'Smart Home',
    description:
      'Room-filling 80W spatial smart speaker with upward Dolby height driver, 6-mic far-field array, and lossless Wi-Fi streaming.',
    price: 6999,
    mrp: 9499,
    rating: 4.8,
    ratingCount: 415,
    stock: 10,
    imageUrl: '/src/assets/images/product_speaker_acoustic_1795037380965.jpg',
    modelPreset: 'speaker',
    dealLabel: 'Cinema Grade',
    specs: {
      Output: '80W Spatial 360°',
      Microphones: '6-Mic Far-Field',
      Connectivity: 'Wi-Fi 6 + AirPlay + BT',
      'Water Resistance': 'IPX4 Desk Safe',
      Chassis: 'Anodized Aluminum',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Obsidian Matte', hex: '#141416' },
      { name: 'Warm Titanium', hex: '#6c6864' },
    ],
    tags: ['speaker', 'smart speaker', 'dolby', 'home', 'wifi', 'voice', 'audio'],
  },
  {
    id: 'vc-sneakers-tempo',
    title: 'StrideLab Tempo Knit 2',
    brand: 'StrideLab',
    category: 'footwear',
    categoryLabel: 'Footwear',
    description:
      'Featherlight 210g breathable knit trainers engineered for morning jogs, gym sessions, and everyday city commutes.',
    price: 1899,
    mrp: 2999,
    rating: 4.5,
    ratingCount: 1940,
    stock: 40,
    imageUrl: '/src/assets/images/product_sneakers_runner_1795037381802.jpg',
    modelPreset: 'sneakers',
    dealLabel: '37% Off',
    specs: {
      Weight: '210g (UK 8)',
      Midsole: 'CloudEVA Cushion',
      Upper: 'Breathable AeroMesh',
      'Water Resistance': 'Quick-Dry Knit',
      Drop: '6mm Natural Stride',
      Warranty: '6 Months',
    },
    variants: [
      { name: 'Carbon Amber', hex: '#ff6a00' },
      { name: 'Stealth Black', hex: '#18181a' },
      { name: 'Ash Grey', hex: '#6b6f76' },
    ],
    tags: ['running', 'shoes', 'sneakers', 'footwear', 'gym', 'jog', 'budget'],
  },
  {
    id: 'vc-sneakers-trail',
    title: 'StrideLab AeroTrail GTX',
    brand: 'StrideLab',
    category: 'footwear',
    categoryLabel: 'Footwear',
    description:
      'All-weather trail and monsoon running shoes featuring multi-directional lug grip, waterproof membrane, and reinforced toe bumper.',
    price: 4299,
    mrp: 5999,
    rating: 4.8,
    ratingCount: 730,
    stock: 16,
    imageUrl: '/src/assets/images/product_sneakers_runner_1795037381802.jpg',
    modelPreset: 'sneakers',
    dealLabel: 'All-Terrain',
    specs: {
      Weight: '268g (UK 8)',
      Midsole: 'Dual-Density Carbon',
      Upper: 'Waterproof Ripstop',
      'Water Resistance': '100% Waterproof',
      Outsole: '4mm Trail Lugs',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Burnt Rust', hex: '#b84b14' },
      { name: 'Obsidian Slate', hex: '#232528' },
    ],
    tags: ['running', 'shoes', 'trail', 'sneakers', 'footwear', 'waterproof', 'trek'],
  },
  {
    id: 'vc-keyboard-60',
    title: 'KeyCraft 60 Swift Hall-Effect',
    brand: 'VibeLab',
    category: 'peripherals',
    categoryLabel: 'Peripherals',
    description:
      'Ultra-compact 60% esports magnetic keyboard with adjustable rapid-trigger actuation (0.1mm–4.0mm) and 8000Hz polling.',
    price: 3799,
    mrp: 4999,
    rating: 4.7,
    ratingCount: 860,
    stock: 19,
    imageUrl: '/src/assets/images/product_keyboard_mech_1795037381618.jpg',
    modelPreset: 'keyboard',
    dealLabel: '24% Off',
    specs: {
      Polling: '8000Hz Ultra-Low',
      Layout: '60% Esports (61 Keys)',
      Switches: 'Magnetic Hall-Effect',
      Connectivity: 'USB-C Braided',
      Chassis: 'Reinforced Alloy',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Inferno Amber', hex: '#ff6a00' },
      { name: 'Shadow Black', hex: '#141416' },
    ],
    tags: ['keyboard', 'gaming', 'esports', 'magnetic', 'compact', 'mechanical'],
  },
  {
    id: 'vc-keyboard-ergo',
    title: 'KeyCraft Pro 98 Silent Office',
    brand: 'VibeLab',
    category: 'peripherals',
    categoryLabel: 'Peripherals',
    description:
      'Full-numpad 98% wireless productivity keyboard with factory-lubed silent tactile switches, multi-host 3x Bluetooth, and 220-hour battery.',
    price: 4499,
    mrp: 5999,
    rating: 4.6,
    ratingCount: 510,
    stock: 14,
    imageUrl: '/src/assets/images/product_keyboard_mech_1795037381618.jpg',
    modelPreset: 'keyboard',
    dealLabel: 'Silent Tactile',
    specs: {
      Battery: '5000mAh (220h)',
      Layout: '98% + Numpad (99 Keys)',
      Switches: 'Lubed Silent Tactile',
      Connectivity: '2.4GHz / 3x BT / USB-C',
      Chassis: 'Matte Aluminum Top',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Graphite Espresso', hex: '#2c2927' },
      { name: 'Titanium Grey', hex: '#5f6368' },
    ],
    tags: ['keyboard', 'mechanical', 'wireless', 'office', 'work', 'silent', 'numpad'],
  },
  {
    id: 'vc-camera-pocket',
    title: 'Lumixor 4K Pocket Action Cam',
    brand: 'Lumixor',
    category: 'cameras',
    categoryLabel: 'Cameras',
    description:
      'Waterproof 4K 60fps pocket vlog and action camera with dual OLED touchscreens, HorizonLock stabilization, and magnetic quick mount.',
    price: 8999,
    mrp: 11999,
    rating: 4.8,
    ratingCount: 685,
    stock: 12,
    imageUrl: '/src/assets/images/product_camera_action_1795193455405.jpg',
    modelPreset: 'camera',
    dealLabel: '25% Off',
    specs: {
      Video: '4K 60fps HDR',
      Stabilization: 'HorizonLock 360',
      'Water Resistance': '10m Waterproof',
      Display: 'Dual OLED Touch',
      Battery: '140 mins Recording',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#1a1918' },
      { name: 'Titanium Matte', hex: '#5c5f66' },
    ],
    tags: ['camera', 'action cam', 'vlog', '4k', 'waterproof', 'travel', 'creator'],
  },
  {
    id: 'vc-glasses-spectra',
    title: 'Spectra AI Smart Glasses',
    brand: 'VibeLab',
    category: 'eyewear',
    categoryLabel: 'Smart Eyewear',
    description:
      'Polarized open-ear audio smart sunglasses with dual beamforming microphones, hands-free voice assistant triggers, and UV400 lenses.',
    price: 6999,
    mrp: 9499,
    rating: 4.7,
    ratingCount: 412,
    stock: 15,
    imageUrl: '/src/assets/images/product_glasses_smart_1795193457406.jpg',
    modelPreset: 'glasses',
    dealLabel: 'New Arrival',
    specs: {
      Audio: 'Open-Ear Directional',
      Lenses: 'Polarized UV400',
      Microphones: 'Dual Wind-Cancelling',
      'Water Resistance': 'IPX4 Sweatproof',
      Battery: '8 hrs Playback',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Matte Copper', hex: '#a65e2e' },
      { name: 'Obsidian Frame', hex: '#141416' },
    ],
    tags: ['glasses', 'sunglasses', 'smart glasses', 'eyewear', 'voice', 'audio', 'travel'],
  },
  {
    id: 'vc-powerbank-volt',
    title: 'VoltCore MagSafe 10K Power Bank',
    brand: 'VoltCore',
    category: 'accessories',
    categoryLabel: 'Tech Carry',
    description:
      'Anodized CNC aluminum 10,000mAh magnetic Qi2 wireless power bank with live amber OLED wattage readout and 30W USB-C PD.',
    price: 2199,
    mrp: 3299,
    rating: 4.6,
    ratingCount: 1530,
    stock: 42,
    imageUrl: '/src/assets/images/product_powerbank_mag_1795193456801.jpg',
    modelPreset: 'powerbank',
    dealLabel: '33% Off',
    specs: {
      Capacity: '10,000mAh High-Density',
      Wireless: '15W Qi2 MagSafe',
      Wired: '30W USB-C PD',
      Display: 'Amber OLED Meter',
      Chassis: 'CNC Anodized Alloy',
      Warranty: '18 Months',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#1e1b18' },
      { name: 'Sunset Amber', hex: '#d9601a' },
    ],
    tags: ['powerbank', 'power bank', 'magsafe', 'charger', 'battery', 'travel', 'gift'],
  },
  {
    id: 'vc-lamp-arcbeam',
    title: 'ArcBeam Halo Desk Light Bar',
    brand: 'Aura Acoustics',
    category: 'smart-home',
    categoryLabel: 'Smart Home',
    description:
      'Zero-glare asymmetric monitor and desk light bar with precision wireless rotary dimmer puck and tunable 2700K–6500K ambient lighting.',
    price: 2999,
    mrp: 4299,
    rating: 4.7,
    ratingCount: 790,
    stock: 21,
    imageUrl: '/src/assets/images/product_lamp_desk_1795193455811.jpg',
    modelPreset: 'lamp',
    dealLabel: '30% Off',
    specs: {
      Optics: 'Asymmetric Anti-Glare',
      ColorTemp: '2700K–6500K Ra95',
      Control: 'Wireless Rotary Puck',
      Power: 'USB-C 10W',
      Chassis: 'Brushed Aluminum',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Matte', hex: '#171719' },
      { name: 'Warm Bronze', hex: '#9e592b' },
    ],
    tags: ['lamp', 'light bar', 'desk light', 'monitor', 'smart home', 'setup', 'work'],
  },
  {
    id: 'vc-bag-nomad',
    title: 'Nomad Tech Sling Backpack',
    brand: 'StrideLab',
    category: 'accessories',
    categoryLabel: 'Tech Carry',
    description:
      '1680D ballistic nylon weatherproof commuter tech sling bag with padded 11-inch tablet sleeve, Fidlock magnetic buckle, and USB-C pass-through.',
    price: 3299,
    mrp: 4999,
    rating: 4.8,
    ratingCount: 940,
    stock: 27,
    imageUrl: '/src/assets/images/product_bag_sling_1795193457665.jpg',
    modelPreset: 'backpack',
    dealLabel: '34% Off',
    specs: {
      Material: '1680D Ballistic Nylon',
      Capacity: '9L Organized Carry',
      Hardware: 'Anodized Alloy Buckle',
      'Water Resistance': 'YKK AquaGuard Zippers',
      DeviceFit: 'Up to 11" Tablet',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Carbon Orange', hex: '#c85a17' },
      { name: 'Stealth Black', hex: '#151517' },
    ],
    tags: ['bag', 'sling', 'backpack', 'carry', 'commute', 'travel', 'waterproof'],
  },
  {
    id: 'vc-mouse-glidepro',
    title: 'GlidePro Magnesium Wireless Mouse',
    brand: 'VibeLab',
    category: 'peripherals',
    categoryLabel: 'Peripherals',
    description:
      'Ultralight 52g perforated magnesium-alloy esports wireless mouse featuring a 26,000 DPI optical sensor, copper scroll wheel, and 4000Hz wireless dongle.',
    price: 2699,
    mrp: 3999,
    rating: 4.8,
    ratingCount: 1080,
    stock: 25,
    imageUrl: '/src/assets/images/product_mouse_esports_1795193459046.jpg',
    modelPreset: 'mouse',
    dealLabel: '33% Off',
    specs: {
      Weight: '52g Magnesium Shell',
      Sensor: 'PAW3395 26K DPI',
      Polling: '4000Hz Wireless',
      Battery: '80 hrs USB-C',
      Switches: 'Optical Micro 90M',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#b85c27' },
      { name: 'Stealth Matte', hex: '#141416' },
    ],
    tags: ['mouse', 'gaming', 'wireless', 'esports', 'lightweight', 'desk', 'work'],
  },
  {
    id: 'vc-gamepad-apex',
    title: 'Vortex Hall-Effect Pro Gamepad',
    brand: 'VibeLab',
    category: 'gaming',
    categoryLabel: 'Gaming Gear',
    description:
      'Zero-drift Hall-Effect magnetic thumbsticks, tactile micro-switch triggers, 1000Hz 2.4GHz wireless dongle, and warm copper trim.',
    price: 3999,
    mrp: 5499,
    rating: 4.9,
    ratingCount: 740,
    stock: 22,
    imageUrl: '/src/assets/images/product_gaming_controller_1795243122415.jpg',
    modelPreset: 'controller',
    dealLabel: 'Esports Pro',
    specs: {
      Sticks: 'Hall-Effect Zero Drift',
      Polling: '1000Hz 2.4GHz + USB-C',
      Triggers: '2-Stage Hair-Trigger',
      Battery: '42 hrs Li-Po',
      Compatibility: 'PC / Android / Switch',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#c85a17' },
      { name: 'Stealth Matte', hex: '#161618' },
    ],
    tags: ['gamepad', 'controller', 'gaming', 'esports', 'joystick', 'pc gaming', 'wireless'],
  },
  {
    id: 'vc-headset-nexus',
    title: 'Nexus Spatial 2.4GHz Gaming Headset',
    brand: 'Aura Acoustics',
    category: 'gaming',
    categoryLabel: 'Gaming Gear',
    description:
      '50mm graphene gaming headset with ultra-low 18ms lossless 2.4GHz wireless, detachable broadcast mic, and cooling memory earcups.',
    price: 4799,
    mrp: 6999,
    rating: 4.7,
    ratingCount: 510,
    stock: 16,
    imageUrl: '/src/assets/images/product_headphones_studio_1795037379361.jpg',
    modelPreset: 'headphones',
    dealLabel: '31% Off',
    specs: {
      Driver: '50mm Graphene Spatial',
      Latency: '18ms 2.4GHz Wireless',
      Battery: '60 hrs Continuous',
      Microphone: 'AI Noise-Cancelling Boom',
      Weight: '275g Featherlight',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Obsidian Amber', hex: '#ff6a00' },
      { name: 'Graphite Black', hex: '#1e1f22' },
    ],
    tags: ['headset', 'gaming', 'esports', 'wireless', 'mic', 'low latency', 'audio'],
  },
  {
    id: 'vc-dock-thunder',
    title: 'Forge TB4 Rotary Desk Dock',
    brand: 'VoltCore',
    category: 'workspace',
    categoryLabel: 'Desk & Setup',
    description:
      'CNC-milled 12-in-1 Thunderbolt 4 & USB-C workstation dock featuring dual 4K 60Hz output, 96W host charging, and machined copper volume dial.',
    price: 7499,
    mrp: 9999,
    rating: 4.8,
    ratingCount: 380,
    stock: 13,
    imageUrl: '/src/assets/images/product_workspace_dock_1795243122469.jpg',
    modelPreset: 'dock',
    dealLabel: '25% Off',
    specs: {
      Ports: '12-in-1 TB4 + 2.5GbE',
      Display: 'Dual 4K 60Hz / 8K 30Hz',
      PowerDelivery: '96W Laptop Pass-Through',
      Control: 'Copper Rotary DAC Dial',
      Chassis: 'Unibody CNC Aluminum',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#b85c27' },
      { name: 'Space Titanium', hex: '#54575c' },
    ],
    tags: ['dock', 'hub', 'thunderbolt', 'usb-c', 'workspace', 'desk', 'setup', 'laptop'],
  },
  {
    id: 'vc-desk-mat-arc',
    title: 'ArcDock MagSafe Desk Console',
    brand: 'VoltCore',
    category: 'workspace',
    categoryLabel: 'Desk & Setup',
    description:
      'Weighted anodized desk charging console & USB hub combining a 15W Qi2 phone stand, SD 4.0 card reader, and warm ambient halo light.',
    price: 3499,
    mrp: 4799,
    rating: 4.6,
    ratingCount: 620,
    stock: 20,
    imageUrl: '/src/assets/images/product_lamp_desk_1795193455811.jpg',
    modelPreset: 'dock',
    dealLabel: 'Studio Essential',
    specs: {
      Wireless: '15W Qi2 Standby Stand',
      Reader: 'UHS-II SD + microSD',
      Ports: '3x USB-C 10Gbps',
      Weight: '480g Anti-Slip Steel',
      Cable: '1.5m Braided USB-C',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Matte Obsidian', hex: '#141416' },
      { name: 'Warm Bronze', hex: '#a65e2e' },
    ],
    tags: ['desk', 'workspace', 'setup', 'dock', 'hub', 'magsafe', 'charger', 'office'],
  },
  {
    id: 'vc-recovery-pulse',
    title: 'Kinetix Mini Recovery Gun',
    brand: 'ChronoFit',
    category: 'fitness',
    categoryLabel: 'Fitness & Recovery',
    description:
      'Whisper-quiet 38dB brushless pocket percussive muscle massager with 12kg stall force, 5 speeds, and 4 silicone recovery heads.',
    price: 3699,
    mrp: 5499,
    rating: 4.8,
    ratingCount: 1340,
    stock: 26,
    imageUrl: '/src/assets/images/product_fitness_gun_1795243122555.jpg',
    modelPreset: 'recovery',
    dealLabel: '33% Off',
    specs: {
      Amplitude: '8mm Deep Tissue',
      Noise: '38dB Whisper Brushless',
      Battery: '4 hrs USB-C Fast Charge',
      Speeds: '1800–3200 RPM (5 Gears)',
      Weight: '440g Pocket Alloy',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#b85c27' },
      { name: 'Carbon Matte', hex: '#161618' },
    ],
    tags: ['massage', 'massage gun', 'recovery', 'fitness', 'gym', 'workout', 'muscle', 'gift'],
  },
  {
    id: 'vc-fitness-band',
    title: 'ChronoCore Screenless Recovery Strap',
    brand: 'ChronoFit',
    category: 'fitness',
    categoryLabel: 'Fitness & Recovery',
    description:
      'Featherlight screenless biometric recovery band tracking HRV, strain, sleep stages, and VO2 recovery with 14-day continuous battery.',
    price: 4499,
    mrp: 5999,
    rating: 4.7,
    ratingCount: 540,
    stock: 19,
    imageUrl: '/src/assets/images/product_smartwatch_pulse_1795037380625.jpg',
    modelPreset: 'smartwatch',
    dealLabel: 'Zero-Screen Focus',
    specs: {
      Metrics: 'HRV, SpO2, Strain, Sleep',
      Battery: '14 days Slide-On Charge',
      'Water Resistance': '5ATM Swimproof',
      Weight: '22g Knit Strap',
      Sync: 'Auto BLE 5.3 App Sync',
      Warranty: '1 Year',
    },
    variants: [
      { name: 'Obsidian Weave', hex: '#1c1c1e' },
      { name: 'Ember Stripe', hex: '#d9601a' },
    ],
    tags: ['fitness', 'recovery', 'band', 'tracker', 'sleep', 'hrv', 'workout', 'gym'],
  },
  {
    id: 'vc-charger-gan140',
    title: 'VoltCore 140W GaN Travel Brick',
    brand: 'VoltCore',
    category: 'travel',
    categoryLabel: 'Travel Tech',
    description:
      'Ultra-compact 140W GaN PD 3.1 triple USB-C charger with real-time amber wattage OLED screen and snap-on EU/UK/IN travel plugs.',
    price: 3299,
    mrp: 4999,
    rating: 4.9,
    ratingCount: 1760,
    stock: 34,
    imageUrl: '/src/assets/images/product_travel_gancharger_1795243121908.jpg',
    modelPreset: 'charger',
    dealLabel: '34% Off',
    specs: {
      Output: '140W PD 3.1 (3x USB-C)',
      Display: 'Live Amber Wattage OLED',
      Technology: 'GaN-III Cool Thermal',
      Plugs: 'India + US/UK/EU Adapters',
      Weight: '215g Pocket Size',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Obsidian Copper', hex: '#b85c27' },
      { name: 'Graphite Matte', hex: '#1a1a1d' },
    ],
    tags: ['charger', 'gan', 'travel', 'adapter', '140w', 'usb-c', 'laptop', 'fast charger'],
  },
  {
    id: 'vc-travel-organizer',
    title: 'Nomad Hard-Shell Tech Organizer',
    brand: 'StrideLab',
    category: 'travel',
    categoryLabel: 'Travel Tech',
    description:
      'Compression-molded water-resistant flight tech pouch engineered to hold GaN bricks, SSDs, AirTags, cables, and pocket audio gear upright.',
    price: 1799,
    mrp: 2699,
    rating: 4.6,
    ratingCount: 890,
    stock: 38,
    imageUrl: '/src/assets/images/product_bag_sling_1795193457665.jpg',
    modelPreset: 'backpack',
    dealLabel: 'Flight Ready',
    specs: {
      Shell: 'EVA Ripstop Water-Resistant',
      Layout: '180° Origami Pockets',
      Hardware: 'Waterproof YKK Zippers',
      Slot: 'Hidden Tracker Pocket',
      Weight: '260g Compact',
      Warranty: '2 Years',
    },
    variants: [
      { name: 'Stealth Black', hex: '#141416' },
      { name: 'Burnt Copper', hex: '#b85c27' },
    ],
    tags: ['travel', 'organizer', 'pouch', 'bag', 'flight', 'carry', 'cables', 'budget'],
  },
];

export interface SearchFilter {
  query?: string;
  category?: Product['category'] | 'all';
  maxPrice?: number;
  minPrice?: number;
  color?: string;
}

const SYNONYMS: Record<string, string[]> = {
  earbuds: ['earbuds', 'earphones', 'tws', 'pods', 'buds', 'ईयरबड्स', 'ಇಯರ್‌ಬಡ್ಸ್'],
  headphones: ['headphones', 'headset', 'over-ear', 'हेडफोन', 'ಹೆಡ್‌ಫೋನ್'],
  shoes: ['shoes', 'sneakers', 'running', 'jog', 'jogging', 'footwear', 'जूते', 'ಶೂ'],
  watch: ['watch', 'smartwatch', 'tracker', 'fitness', 'workout', 'घड़ी', 'ವಾಚ್'],
  speaker: ['speaker', 'smart speaker', 'स्पीकर', 'ಸ್ಪೀಕರ್'],
  keyboard: ['keyboard', 'mechanical', 'gaming', 'कीबोर्ड'],
  camera: ['camera', 'action cam', 'vlog', '4k', 'कैमरा'],
  glasses: ['glasses', 'sunglasses', 'eyewear', 'चश्मा'],
  powerbank: ['powerbank', 'power bank', 'charger', 'magsafe', 'पावर बैंक'],
  lamp: ['lamp', 'light bar', 'desk light', 'monitor light'],
  bag: ['bag', 'sling', 'backpack', 'carry', 'pouch', 'organizer', 'बैग'],
  mouse: ['mouse', 'gaming mouse', 'esports', 'माउस'],
  gaming: ['gaming', 'gamepad', 'controller', 'joystick', 'esports', 'console'],
  workspace: ['dock', 'hub', 'thunderbolt', 'workspace', 'desk', 'setup', 'office'],
  fitness: ['massage', 'massage gun', 'recovery', 'fitness', 'gym', 'workout', 'hrv'],
  travel: ['travel', 'gan', 'charger', 'adapter', 'flight', 'portable'],
};

export function searchCatalog(
  filter: SearchFilter = {},
  sourceCatalog: Product[] = CATALOG
): Product[] {
  const rawQuery = (filter.query ?? '').toLowerCase().trim();
  const tokens = rawQuery
    .split(/\s+/)
    .filter((w) => w.length > 1 && !['for', 'the', 'and', 'with', 'best', 'good', 'me'].includes(w));

  const expandedTokens = new Set<string>(tokens);
  for (const t of tokens) {
    for (const [key, list] of Object.entries(SYNONYMS)) {
      if (key === t || list.includes(t)) {
        expandedTokens.add(key);
        list.forEach((syn) => expandedTokens.add(syn));
      }
    }
  }

  let items = sourceCatalog.filter((p) => {
    if (filter.category && filter.category !== 'all' && p.category !== filter.category) {
      return false;
    }
    if (typeof filter.maxPrice === 'number' && p.price > filter.maxPrice) {
      return false;
    }
    if (typeof filter.minPrice === 'number' && p.price < filter.minPrice) {
      return false;
    }
    if (filter.color) {
      const c = filter.color.toLowerCase();
      const hasColor = p.variants.some((v) => v.name.toLowerCase().includes(c));
      if (!hasColor) return false;
    }
    return true;
  });

  if (expandedTokens.size > 0) {
    const scored = items
      .map((p) => {
        const haystack = [
          p.title,
          p.brand,
          p.category,
          p.categoryLabel,
          p.description,
          ...p.tags,
          ...p.variants.map((v) => v.name),
        ]
          .join(' ')
          .toLowerCase();

        let score = 0;
        for (const tok of expandedTokens) {
          if (p.title.toLowerCase().includes(tok)) score += 4;
          else if (p.tags.some((tag) => tag.includes(tok))) score += 3;
          else if (haystack.includes(tok)) score += 1;
        }
        return { product: p, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);

    if (scored.length > 0) {
      return scored.map((s) => s.product);
    }
  }

  return [...items].sort((a, b) => b.rating - a.rating);
}
