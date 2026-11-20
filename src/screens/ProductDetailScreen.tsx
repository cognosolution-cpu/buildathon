import React, { useEffect, useState } from 'react';
import { ArrowLeft, GitCompare, Minus, Plus, ShieldCheck, Star } from 'lucide-react';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import { ProductViewer3D } from '../components/three/ProductViewer3D';

export const ProductDetailScreen: React.FC = () => {
  const {
    products,
    focusedProductId,
    navigate,
    addToCart,
    simpleView,
    setSimpleView,
    toggleCompareId,
    compareIds,
    lang,
  } = useVibeCart();

  const product = products.find((p) => p.id === focusedProductId) ?? products[0];
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedVariantIdx(0);
    setQuantity(1);
  }, [product.id]);

  const activeVariant = product.variants[selectedVariantIdx] ?? product.variants[0];
  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const isCompared = compareIds.includes(product.id);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <button
        type="button"
        onClick={() => navigate('results')}
        className="inline-flex items-center gap-2 text-sm text-[#9A9A9A] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explore</span>
      </button>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Product Viewer / Studio Photo */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <ProductViewer3D
            preset={product.modelPreset}
            accentHex={activeVariant?.hex ?? '#ff6a00'}
            title={product.title}
            imageUrl={product.imageUrl}
            simpleView={simpleView}
            onToggleSimpleView={() => setSimpleView(!simpleView)}
          />
        </div>

        {/* Right: Purchase & Specifications */}
        <div className="lg:col-span-6 rounded-[20px] vc-glass p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9A9A9A] mb-2">
              <span className="text-[#FFA040] font-medium">{product.brand}</span>
              <span aria-hidden="true">·</span>
              <span>{product.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-[#F5F5F5] tabular-nums">
                <Star className="w-3.5 h-3.5 fill-[#FFC83D] text-[#FFC83D]" />
                {product.rating.toFixed(1)} ({product.ratingCount} reviews)
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F5]">
              {product.title}
            </h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-mono-num text-3xl font-bold text-[#F5F5F5] tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span className="font-mono-num text-base text-[#9A9A9A] line-through tabular-nums">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
            {discountPct > 0 && (
              <span className="text-xs font-semibold text-[#2EE59D]">
                Save {discountPct}%
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-[#9A9A9A] leading-relaxed">
            {product.description}
          </p>

          {/* Finish / Colorway Selector */}
          <div>
            <p className="text-xs font-medium text-[#9A9A9A] mb-2.5">
              Finish: <span className="text-[#F5F5F5]">{activeVariant?.name}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v, i) => {
                const selected = i === selectedVariantIdx;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelectedVariantIdx(i)}
                    aria-pressed={selected}
                    className={`h-10 px-3.5 rounded-[14px] border inline-flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                        : 'border-white/10 bg-white/5 text-[#9A9A9A] hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/25"
                      style={{ backgroundColor: v.hex }}
                    />
                    <span>{v.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Primary Purchase CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <div className="inline-flex items-center justify-between h-12 px-2 rounded-[14px] bg-[#111111] border border-white/10 sm:w-32 shrink-0">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#9A9A9A] hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono-num text-sm font-semibold text-[#F5F5F5] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#9A9A9A] hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => addToCart(product.id, quantity, activeVariant?.name)}
              className="w-full sm:w-auto sm:flex-1 h-12 shrink-0 px-6 rounded-[14px] bg-white text-[#050505] text-sm font-semibold hover:bg-[#F5F5F5] hover:shadow-[0_0_24px_rgba(255,160,64,0.3)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              {t(lang, 'addToCart')} · ₹{(product.price * quantity).toLocaleString('en-IN')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isCompared) toggleCompareId(product.id);
                navigate('compare');
              }}
              className="h-12 px-4 rounded-[14px] bg-white/5 border border-white/10 text-sm font-medium text-[#F5F5F5] hover:border-[#FF6A00] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <GitCompare className="w-4 h-4 text-[#FFA040]" />
              <span>Compare</span>
            </button>
          </div>

          {/* Technical Specifications */}
          <div className="pt-4 border-t border-white/10">
            <h2 className="font-display text-sm font-semibold text-[#F5F5F5] mb-3">
              Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(product.specs).map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-[14px] bg-[#0B0B0B] border border-white/10 p-3"
                >
                  <dt className="text-[11px] text-[#9A9A9A]">{key}</dt>
                  <dd className="text-sm font-medium text-[#F5F5F5] mt-0.5 tabular-nums">
                    {val}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#2EE59D]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>In stock ({product.stock} units) · Free delivery over ₹999</span>
          </div>
        </div>
      </div>

      {/* Mobile App Sticky Purchase Bar (above MobileBottomNav) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-[#0B0B0B]/95 backdrop-blur-lg border-t border-white/10 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[#9A9A9A] truncate">{activeVariant?.name}</p>
          <p className="font-mono-num text-base font-bold text-[#F5F5F5] tabular-nums">
            ₹{(product.price * quantity).toLocaleString('en-IN')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => addToCart(product.id, quantity, activeVariant?.name)}
          className="h-11 px-5 rounded-[12px] bg-white text-[#050505] text-xs font-semibold active:scale-95 transition-transform cursor-pointer whitespace-nowrap shrink-0"
        >
          {t(lang, 'addToCart')}
        </button>
      </div>
    </div>
  );
};
