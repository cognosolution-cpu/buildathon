import React, { useState } from 'react';
import { Box, Check, Plus, Star } from 'lucide-react';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index: number;
  showCompareToggle?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index,
  showCompareToggle = false,
}) => {
  const { navigate, addToCart, compareIds, toggleCompareId, lang, simpleView } = useVibeCart();
  const [imgError, setImgError] = useState(false);

  const isCompared = compareIds.includes(product.id);
  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <article
      data-product-id={product.id}
      className="group relative flex flex-col rounded-[18px] sm:rounded-[20px] vc-glass p-3 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF6A00]/45"
    >
      {/* Image Canvas */}
      <button
        type="button"
        onClick={() => navigate('product', product.id)}
        aria-label={`Inspect ${product.title}`}
        className="relative aspect-square w-full rounded-[12px] sm:rounded-[14px] bg-[#0B0B0B] overflow-hidden mb-3 sm:mb-4 cursor-pointer block text-left"
      >
        {!imgError ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1A1410] to-[#0B0B0B] p-4 text-center">
            <Box className="w-8 h-8 text-[#FF6A00] mb-2" />
            <span className="text-xs text-[#9A9A9A]">{product.title}</span>
          </div>
        )}

        {/* Voice reference index (1..N) */}
        <span
          aria-label={`Result number ${index}`}
          className="absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#050505]/85 border border-white/15 text-[11px] sm:text-xs font-mono-num font-semibold text-[#F5F5F5] flex items-center justify-center"
        >
          {index}
        </span>

        {/* 2D Photo vs 3D Ready badge */}
        <span
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-[#050505]/80 text-[10px] sm:text-[11px] font-medium ${
            simpleView ? 'text-[#2EE59D]' : 'text-[#FFC83D]'
          }`}
        >
          {simpleView ? '2D Photo' : '3D Ready'}
        </span>
      </button>

      {/* Unboxed Clean Metadata */}
      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[#9A9A9A] mb-1 truncate">
        <span className="truncate">{product.brand}</span>
        {discountPct > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-[#FFC83D] font-medium shrink-0">{discountPct}% off</span>
          </>
        )}
      </div>

      {/* Product Title Button -> Opens Product Detail */}
      <button
        type="button"
        onClick={() => navigate('product', product.id)}
        className="text-left font-display text-sm sm:text-base font-semibold text-[#F5F5F5] hover:text-[#FFA040] transition-colors line-clamp-1 mb-1.5 sm:mb-2 cursor-pointer"
      >
        {product.title}
      </button>

      {/* Rating & Tabular Pricing */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3 sm:mb-4">
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="font-mono-num text-base sm:text-lg font-semibold text-[#F5F5F5] tabular-nums">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <span className="font-mono-num text-[11px] sm:text-xs text-[#9A9A9A] line-through tabular-nums">
            ₹{product.mrp.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[#F5F5F5] tabular-nums">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#FFC83D] text-[#FFC83D]" />
          <span className="font-medium">{product.rating.toFixed(1)}</span>
          <span className="hidden sm:inline text-[#9A9A9A]">({product.ratingCount})</span>
        </div>
      </div>

      {/* Actions Row */}
      <div className="mt-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => addToCart(product.id, 1)}
          aria-label={`Add ${product.title} to cart`}
          className="flex-1 h-10 sm:h-11 px-2.5 sm:px-4 rounded-[12px] sm:rounded-[14px] bg-white text-[#050505] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1 sm:gap-1.5 hover:bg-[#F5F5F5] hover:shadow-[0_0_20px_rgba(255,160,64,0.3)] active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">{t(lang, 'addToCart')}</span>
        </button>

        {showCompareToggle ? (
          <button
            type="button"
            onClick={() => toggleCompareId(product.id)}
            aria-label={isCompared ? `Remove ${product.title} from compare` : `Compare ${product.title}`}
            aria-pressed={isCompared}
            className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-[12px] sm:rounded-[14px] border text-[11px] sm:text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
              isCompared
                ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-[#F5F5F5]'
                : 'bg-white/5 border-white/10 text-[#9A9A9A] hover:text-white'
            }`}
          >
            {isCompared && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FFA040]" />}
            <span>{isCompared ? 'Added' : 'Cmp'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('product', product.id)}
            className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-[12px] sm:rounded-[14px] bg-white/5 border border-white/10 text-[11px] sm:text-xs font-medium text-[#F5F5F5] hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            {simpleView ? '2D' : '3D'}
            <span className="hidden sm:inline"> View</span>
          </button>
        )}
      </div>
    </article>
  );
};
