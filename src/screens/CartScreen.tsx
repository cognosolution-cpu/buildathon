import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import { Cart3D } from '../components/three/Cart3D';

export const CartScreen: React.FC = () => {
  const {
    products,
    cart,
    cartCount,
    cartSubtotal,
    shippingFee,
    cartTotal,
    lastAddedPulse,
    updateQuantity,
    removeFromCart,
    navigate,
    simpleView,
    setSimpleView,
    lang,
  } = useVibeCart();

  if (cart.length === 0) {
    return (
      <div className="rounded-[20px] vc-glass p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FF6A00]/15 text-[#FF6A00] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-[#F5F5F5]">
          {t(lang, 'emptyCart')}
        </h1>
        <p className="text-sm text-[#9A9A9A]">
          Say “Show wireless earbuds under 2000” or explore our studio collection to add items.
        </p>
        <button
          type="button"
          onClick={() => navigate('results')}
          className="h-12 px-6 rounded-[14px] bg-white text-[#050505] text-sm font-semibold hover:bg-[#F5F5F5] cursor-pointer"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
          Your Cart ({cartCount})
        </h1>
        <p className="text-sm text-[#9A9A9A] mt-1">
          {cartSubtotal > 999
            ? 'Unlocked complimentary express shipping.'
            : `Add ₹${(1000 - cartSubtotal).toLocaleString('en-IN')} more for free express shipping.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Cart Visualizer + Itemized List */}
        <div className="lg:col-span-7 space-y-5">
          <Cart3D
            items={cart}
            pulseKey={lastAddedPulse}
            simpleView={simpleView}
            onToggleSimpleView={() => setSimpleView(!simpleView)}
          />

          <div className="space-y-3">
            {cart.map((item) => {
              const prod = products.find((p) => p.id === item.productId);
              if (!prod) return null;
              return (
                <div
                  key={`${item.productId}-${item.variantName}`}
                  className="rounded-[20px] vc-glass p-4 sm:p-5 flex items-center gap-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate('product', prod.id)}
                    className="w-20 h-20 rounded-[14px] bg-[#0B0B0B] overflow-hidden shrink-0 cursor-pointer"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#9A9A9A]">
                      {prod.brand} · {item.variantName}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('product', prod.id)}
                      className="font-display text-base font-semibold text-[#F5F5F5] hover:text-[#FFA040] truncate block text-left w-full cursor-pointer"
                    >
                      {prod.title}
                    </button>
                    <p className="font-mono-num text-sm font-semibold text-[#F5F5F5] mt-1 tabular-nums">
                      ₹{(prod.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <div className="inline-flex items-center h-10 px-1.5 rounded-xl bg-[#111111] border border-white/10">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${prod.title}`}
                        onClick={() =>
                          updateQuantity(item.productId, item.variantName, item.quantity - 1)
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9A9A9A] hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono-num text-xs font-semibold text-[#F5F5F5] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${prod.title}`}
                        onClick={() =>
                          updateQuantity(item.productId, item.variantName, item.quantity + 1)
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9A9A9A] hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${prod.title} from cart`}
                      onClick={() => removeFromCart(item.productId, item.variantName)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9A9A9A] hover:text-[#FF4D5E] hover:border-[#FF4D5E]/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 rounded-[20px] vc-glass p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-[#9A9A9A]">
              <span>Subtotal ({cartCount} items)</span>
              <span className="font-mono-num text-[#F5F5F5] tabular-nums">
                ₹{cartSubtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#9A9A9A]">
              <span>Express Delivery</span>
              <span className="font-mono-num text-[#2EE59D] tabular-nums">
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
              </span>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-[#F5F5F5]">Total</span>
              <span className="font-mono-num text-2xl font-bold text-[#F5F5F5] tabular-nums">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('checkout')}
            className="w-full h-12 px-6 rounded-[14px] bg-white text-[#050505] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#F5F5F5] hover:shadow-[0_0_24px_rgba(255,160,64,0.3)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{t(lang, 'proceedCheckout')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-[#9A9A9A] text-center">
            Voice command: say “Checkout” anytime to jump directly to payment.
          </p>
        </aside>
      </div>
    </div>
  );
};
