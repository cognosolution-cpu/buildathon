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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-lg border-t border-white/10 pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
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
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors cursor-pointer ${
                active ? 'text-[#FF6A00]' : 'text-[#9A9A9A] hover:text-[#F5F5F5]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF6A00] text-[#050505] text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
