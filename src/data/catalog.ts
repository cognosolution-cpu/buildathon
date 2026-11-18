import type { Product } from '../types';

export const HERO_IMAGE = '/src/assets/images/hero_vibecart_acoustic_1795037378526.jpg';

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
];

export interface SearchFilter {
  query?: string;
  category?: Product['category'] | 'all';
  maxPrice?: number;
  minPrice?: number;
  color?: string;
}

const SYNONYMS: Record<string, string[]> = {
  earbuds: ['earbuds', 'earphones', 'tws', 'pods', 'buds', 'workout', 'gym', 'ईयरबड्स', 'ಇಯರ್‌ಬಡ್ಸ್'],
  headphones: ['headphones', 'headset', 'over-ear', 'हेडफोन', 'ಹೆಡ್‌ಫೋನ್'],
  shoes: ['shoes', 'sneakers', 'running', 'jog', 'jogging', 'footwear', 'जूते', 'ಶೂ'],
  watch: ['watch', 'smartwatch', 'tracker', 'fitness', 'workout', 'घड़ी', 'ವಾಚ್'],
  speaker: ['speaker', 'smart speaker', 'स्पीकर', 'ಸ್ಪೀಕರ್'],
  keyboard: ['keyboard', 'mechanical', 'gaming', 'कीबोर्ड'],
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
