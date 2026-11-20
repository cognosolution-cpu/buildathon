import React from 'react';
import { Compass, Home, Package, ShoppingBag, User } from 'lucide-react';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import type { RouteName } from '../types';

export const MobileBottomNav: React.FC = () => {
  const { route, navigate, cartCount, lang } = useVibeCart();

  const tabs: Array<{
    id: RouteName;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: t(lang, 'navHome'), icon: Home },
    { id: 'results', label: t(lang, 'navExplore'), icon: Compass },
    { id: 'cart', label: t(lang, 'navCart'), icon: ShoppingBag, badge: cartCount },
    { id: 'orders', label: t(lang, 'navOrders'), icon: Package },
    { id: 'profile', label: t(lang, 'navProfile'), icon: User },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.65)]"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            route === tab.id ||
            (tab.id === 'results' && (route === 'product' || route === 'compare')) ||
            (tab.id === 'cart' && route === 'checkout');

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                active
                  ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                  : 'text-[#9A9A9A] hover:text-[#F5F5F5]'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-0.5 rounded-full bg-[#FF6A00]"
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF6A00] text-[#050505] text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
