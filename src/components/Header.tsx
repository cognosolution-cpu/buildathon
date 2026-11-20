import React from 'react';
import { ShoppingBag, User } from 'lucide-react';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import type { RouteName } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => {
  const { route, navigate, cartCount, lang, authMode, authEmail, profile } = useVibeCart();

  const navLinks: Array<{ id: RouteName; label: string }> = [
    { id: 'home', label: t(lang, 'navHome') },
    { id: 'results', label: t(lang, 'navExplore') },
    { id: 'compare', label: t(lang, 'navCompare') },
    { id: 'orders', label: t(lang, 'navOrders') },
    { id: 'profile', label: t(lang, 'navProfile') },
  ];

  const shortAccountLabel =
    authMode === 'authenticated'
      ? (profile?.fullName?.trim().split(/\s+/)[0] || authEmail?.split('@')[0] || 'Account').slice(0, 14)
      : 'Sign in';

  return (
    <header className="w-full border-b border-white/10 bg-[#050505]/90 sticky top-0 z-30 backdrop-blur-md pt-safe">
      <div className="max-w-[1280px] mx-auto px-3.5 md:px-8 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-8">
        {/* Zone 1: Single-line Brand wordmark + emblem */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] rounded-lg"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="32" height="32" rx="9" fill="#141414" stroke="rgba(255,255,255,0.12)" />
            <circle cx="16" cy="16" r="9.5" stroke="#FF6A00" strokeWidth="2.2" />
            <path
              d="M12 16v-3m4 6V10m4 6v-3"
              stroke="#FFA040"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight text-[#F5F5F5]">
            Vibe<span className="text-[#FF6A00]">Cart</span>
          </span>
        </a>

        {/* Zone 2: Desktop navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => {
            const active = route === item.id || (item.id === 'results' && route === 'product');
            return (
              <a
                key={item.id}
                href={`#/${item.id === 'home' ? '' : item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.id);
                }}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] ${
                  active
                    ? 'text-[#F5F5F5] border-[#FF6A00]'
                    : 'text-[#9A9A9A] border-transparent hover:text-[#F5F5F5]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: PWA Install + Sign in / Account + Cart Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton variant="header" />

          <button
            type="button"
            onClick={() => navigate('profile')}
            aria-label={authMode === 'authenticated' ? 'Open account profile' : 'Sign in or open profile'}
            className={`inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-[12px] sm:rounded-[14px] border text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              route === 'profile'
                ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                : 'border-white/15 bg-white/5 text-[#F5F5F5] hover:bg-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFA040] shrink-0" />
            <span>{shortAccountLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('cart')}
            aria-label={`Open shopping cart with ${cartCount} items`}
            className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-[12px] sm:rounded-[14px] bg-white text-[#050505] text-xs sm:text-sm font-semibold hover:bg-[#F5F5F5] hover:shadow-[0_0_20px_rgba(255,160,64,0.3)] active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t(lang, 'navCart')}</span>
            <span className="font-mono-num text-xs px-1.5 py-0.5 rounded-md bg-[#050505]/10 text-[#050505]">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
