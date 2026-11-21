import React, { useState } from 'react';
import { ArrowRight, Mic, Send } from 'lucide-react';
import { HERO_IMAGE, HOME_FEATURED_IDS } from '../data/catalog';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import { ProductCard } from '../components/ProductCard';

const STARTER_COMMANDS = [
  'Show wireless earbuds under 2000',
  'Running shoes under 3000',
  'Gift for my mom',
  'Where is my order?',
];

const QUICK_CATEGORIES: Array<{ id: import('../types').Product['category']; label: string }> = [
  { id: 'audio', label: 'Audio' },
  { id: 'gaming', label: 'Gaming Gear' },
  { id: 'workspace', label: 'Desk & Setup' },
  { id: 'fitness', label: 'Fitness & Recovery' },
  { id: 'travel', label: 'Travel Tech' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'eyewear', label: 'Eyewear' },
  { id: 'wearables', label: 'Wearables' },
  { id: 'accessories', label: 'Tech Carry' },
  { id: 'smart-home', label: 'Smart Home' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'peripherals', label: 'Peripherals' },
];

export const HomeScreen: React.FC = () => {
  const { products, lang, navigate, runVoiceCommand, setVoiceOverlayOpen, applySearch } = useVibeCart();
  const [commandInput, setCommandInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = commandInput.trim();
    if (!val) return;
    runVoiceCommand(val);
    setCommandInput('');
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Native Mobile Quick Category Strip */}
      <nav
        aria-label="Shop by category"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1"
      >
        <button
          type="button"
          onClick={() => applySearch({ query: '', category: 'all', maxPrice: null }, true)}
          className="h-9 px-3.5 rounded-full bg-[#FF6A00] text-[#050505] text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
        >
          All Gear
        </button>
        {QUICK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => applySearch({ query: '', category: cat.id, maxPrice: null }, true)}
            className="h-9 px-3.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#F5F5F5] hover:border-[#FF6A00] shrink-0 whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Storefront Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
        <div className="lg:col-span-6 min-w-0 flex flex-col justify-center rounded-[20px] vc-glass p-4 sm:p-8 lg:p-10">
          <p className="text-xs font-medium text-[#FFA040] mb-2 sm:mb-3 tracking-wide">
            Voice-First Acoustic & Gear Store
          </p>
          <h1 className="font-display text-[28px] sm:text-[42px] lg:text-[48px] font-bold leading-[1.12] tracking-[-0.02em] text-[#F5F5F5] text-balance mb-3 sm:mb-4">
            {t(lang, 'heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-[#9A9A9A] leading-relaxed max-w-xl mb-5 sm:mb-6">
            {t(lang, 'heroSubtitle')}
          </p>

          {/* Voice Bar / Command Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-3.5 sm:mb-4">
            <div className="relative flex-1">
              <label htmlFor="home-voice-input" className="sr-only">
                Search or speak a shopping command
              </label>
              <input
                id="home-voice-input"
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder={t(lang, 'searchPlaceholder')}
                className="w-full h-12 sm:h-14 pl-3.5 sm:pl-4 pr-12 sm:pr-14 rounded-[14px] bg-[#111111] border border-white/15 font-display text-sm sm:text-base text-[#F5F5F5] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#FF6A00]"
              />
              <button
                type="button"
                onClick={() => setVoiceOverlayOpen(true)}
                aria-label="Open voice microphone"
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FF6A00]/15 text-[#FFA040] hover:bg-[#FF6A00] hover:text-[#050505] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              aria-label="Run command"
              className="h-12 sm:h-14 px-4 sm:px-5 rounded-[14px] bg-white text-[#050505] font-semibold text-sm inline-flex items-center gap-2 hover:bg-[#F5F5F5] hover:shadow-[0_0_24px_rgba(255,160,64,0.3)] active:scale-[0.97] transition-all shrink-0 cursor-pointer"
            >
              <span className="hidden sm:inline">Ask</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Interactive Quick Prompt Buttons (horizontal scroll on mobile, wrap on desktop) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap pb-0.5">
            {STARTER_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => runVoiceCommand(cmd)}
                className="h-8 px-3.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#9A9A9A] hover:text-[#F5F5F5] hover:border-[#FF6A00] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                “{cmd}”
              </button>
            ))}
          </div>
        </div>

        {/* Hero 16:9 Studio Hardware Composition */}
        <div className="lg:col-span-6 min-w-0 relative rounded-[20px] overflow-hidden border border-white/10 bg-[#0B0B0B] min-h-[220px] sm:min-h-[320px] lg:min-h-[420px]">
          <img
            src={HERO_IMAGE}
            alt="VoicoCart studio headphones, obsidian earbuds, and smart acoustic speaker"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-[#050505]/25 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-[11px] sm:text-xs text-[#FFA040] font-medium mb-0.5 sm:mb-1">
                Aura Acoustics · Studio Collection
              </p>
              <p className="font-display text-base sm:text-xl font-semibold text-[#F5F5F5]">
                Inspect every silhouette in 3D before you check out.
              </p>
            </div>
            <button
              type="button"
              onClick={() => applySearch({ query: '', category: 'all', maxPrice: null }, true)}
              className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-[12px] sm:rounded-[14px] bg-white/10 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-medium text-[#F5F5F5] hover:bg-white/20 inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Collection Grid */}
      <section aria-labelledby="featured-heading">
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2
              id="featured-heading"
              className="font-display text-xl sm:text-[28px] font-semibold text-[#F5F5F5]"
            >
              {t(lang, 'featuredHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-[#9A9A9A] mt-0.5 sm:mt-1">
              Say “Add the second one” or “Compare 1 and 2” to act by number.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('results')}
            className="text-xs sm:text-sm font-medium text-[#FFA040] hover:text-white inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {HOME_FEATURED_IDS.map((id) => products.find((p) => p.id === id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .slice(0, 6)
            .map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx + 1} />
            ))}
        </div>
      </section>
    </div>
  );
};
