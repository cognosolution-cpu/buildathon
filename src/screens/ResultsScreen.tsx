import React, { useState } from 'react';
import { GitCompare, Search, SlidersHorizontal, X } from 'lucide-react';
import { useVibeCart } from '../state/store';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';

const CATEGORIES: Array<{ id: Product['category'] | 'all'; label: string }> = [
  { id: 'all', label: 'All Gear' },
  { id: 'audio', label: 'Audio' },
  { id: 'wearables', label: 'Wearables' },
  { id: 'smart-home', label: 'Smart Home' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'peripherals', label: 'Peripherals' },
];

const PRICE_CAPS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Any price' },
  { value: 2000, label: 'Under ₹2,000' },
  { value: 3000, label: 'Under ₹3,000' },
  { value: 5000, label: 'Under ₹5,000' },
];

export const ResultsScreen: React.FC = () => {
  const {
    lastResults,
    searchCriteria,
    applySearch,
    assistantReply,
    compareIds,
    navigate,
  } = useVibeCart();
  const [queryText, setQueryText] = useState(searchCriteria.query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applySearch({ query: queryText }, false);
  };

  const resetFilters = () => {
    setQueryText('');
    applySearch({ query: '', category: 'all', maxPrice: null }, false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
            Explore Collection
          </h1>
          <p className="text-sm text-[#9A9A9A] mt-1">
            {assistantReply || `${lastResults.length} products available · Say a card number (1–${lastResults.length}) to add or inspect.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('compare')}
          className="h-11 px-4 rounded-[14px] bg-white/5 border border-white/10 text-sm font-medium text-[#F5F5F5] hover:border-[#FF6A00] inline-flex items-center gap-2 self-start md:self-auto cursor-pointer whitespace-nowrap"
        >
          <GitCompare className="w-4 h-4 text-[#FFA040]" />
          <span>Compare ({compareIds.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-[20px] vc-glass p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="explore-search" className="sr-only">
              Filter products by keyword
            </label>
            <input
              id="explore-search"
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search earbuds, headphones, shoes, smartwatch..."
              className="w-full h-12 pl-10 pr-4 rounded-[14px] bg-[#111111] border border-white/10 text-sm text-[#F5F5F5] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#FF6A00]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="h-12 px-5 rounded-[14px] bg-white text-[#050505] text-sm font-semibold hover:bg-[#F5F5F5] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              Filter
            </button>
            {(searchCriteria.query || searchCriteria.category !== 'all' || searchCriteria.maxPrice !== null) && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-12 px-3.5 rounded-[14px] bg-white/5 border border-white/10 text-sm text-[#9A9A9A] hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>

        {/* Interactive Category Tabs + Price Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Category filters">
            {CATEGORIES.map((cat) => {
              const active = searchCriteria.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => applySearch({ category: cat.id }, false)}
                  aria-pressed={active}
                  className={`h-8 px-3.5 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-[#F5F5F5] shadow-[0_0_12px_rgba(255,106,0,0.22)]'
                      : 'bg-white/5 border-white/10 text-[#9A9A9A] hover:text-[#F5F5F5]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Price filters">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#9A9A9A] mr-1" />
            {PRICE_CAPS.map((cap) => {
              const active = searchCriteria.maxPrice === cap.value;
              return (
                <button
                  key={cap.label}
                  type="button"
                  onClick={() => applySearch({ maxPrice: cap.value }, false)}
                  aria-pressed={active}
                  className={`h-8 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#050505] border-white'
                      : 'bg-white/5 border-white/10 text-[#9A9A9A] hover:text-[#F5F5F5]'
                  }`}
                >
                  {cap.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {lastResults.length === 0 ? (
        <div className="rounded-[20px] vc-glass p-10 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-[#F5F5F5]">
            No matching products found
          </p>
          <p className="text-sm text-[#9A9A9A]">
            Try clearing your price ceiling or switching categories.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="h-11 px-5 rounded-[14px] bg-white text-[#050505] text-sm font-semibold cursor-pointer"
          >
            Show all products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lastResults.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx + 1}
              showCompareToggle
            />
          ))}
        </div>
      )}
    </div>
  );
};
