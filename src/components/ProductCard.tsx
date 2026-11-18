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
  const { navigate, addToCart, compareIds, toggleCompareId, lang } = useVibeCart();
  const [imgError, setImgError] = useState(false);

  const isCompared = compareIds.includes(product.id);
  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <article
      data-product-id={product.id}
      className="group relative flex flex-col rounded-[20px] vc-glass p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF6A00]/45"
    >
      {/* Image Canvas */}
      <div className="relative aspect-square w-full rounded-[14px] bg-[#0B0B0B] overflow-hidden mb-4">
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
          className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-[#050505]/85 border border-white/15 text-xs font-mono-num font-semibold text-[#F5F5F5] flex items-center justify-center"
        >
          {index}
        </span>

        {/* Single quiet 3D / Deal indicator without pill spam */}
        <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[#050505]/80 text-[11px] font-medium text-[#FFC83D]">
          3D Ready
        </span>
      </div>

      {/* Unboxed Clean Metadata */}
      <div className="flex items-center gap-1.5 text-xs text-[#9A9A9A] mb-1">
        <span>{product.brand}</span>
        <span aria-hidden="true">·</span>
        <span>{product.categoryLabel}</span>
        {discountPct > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-[#FFC83D] font-medium">{discountPct}% off</span>
          </>
        )}
      </div>

      {/* Product Title Button -> Opens Product Detail */}
      <button
        type="button"
        onClick={() => navigate('product', product.id)}
        className="text-left font-display text-base font-semibold text-[#F5F5F5] hover:text-[#FFA040] transition-colors line-clamp-1 mb-2 cursor-pointer"
      >
        {product.title}
      </button>

      {/* Rating & Tabular Pricing */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono-num text-lg font-semibold text-[#F5F5F5] tabular-nums">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <span className="font-mono-num text-xs text-[#9A9A9A] line-through tabular-nums">
            ₹{product.mrp.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#F5F5F5] tabular-nums">
          <Star className="w-3.5 h-3.5 fill-[#FFC83D] text-[#FFC83D]" />
          <span className="font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-[#9A9A9A]">({product.ratingCount})</span>
        </div>
      </div>

      {/* Actions Row */}
      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => addToCart(product.id, 1)}
          aria-label={`Add ${product.title} to cart`}
          className="flex-1 h-11 px-4 rounded-[14px] bg-white text-[#050505] text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#F5F5F5] hover:shadow-[0_0_20px_rgba(255,160,64,0.3)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t(lang, 'addToCart')}</span>
        </button>

        {showCompareToggle ? (
          <button
            type="button"
            onClick={() => toggleCompareId(product.id)}
            aria-label={isCompared ? `Remove ${product.title} from compare` : `Compare ${product.title}`}
            aria-pressed={isCompared}
            className={`h-11 px-3 rounded-[14px] border text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
              isCompared
                ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-[#F5F5F5]'
                : 'bg-white/5 border-white/10 text-[#9A9A9A] hover:text-white'
            }`}
          >
            {isCompared && <Check className="w-3.5 h-3.5 text-[#FFA040]" />}
            <span>Compare</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('product', product.id)}
            className="h-11 px-3.5 rounded-[14px] bg-white/5 border border-white/10 text-xs font-medium text-[#F5F5F5] hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            3D View
          </button>
        )}
      </div>
    </article>
  );
};
