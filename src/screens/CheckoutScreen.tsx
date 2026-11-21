import React, { useCallback, useEffect, useState } from 'react';
import { BookmarkPlus, CreditCard, Lock, ShieldCheck, Smartphone, X } from 'lucide-react';
import { isRazorpayConfigured, launchRazorpayCheckout } from '../lib/razorpay';
import { isSupabaseConfigured } from '../lib/supabase';
import { useVibeCart } from '../state/store';
import type { Address } from '../types';

interface FormErrors {
  name?: string;
  phone?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export const CheckoutScreen: React.FC = () => {
  const {
    products,
    cart,
    cartSubtotal,
    shippingFee,
    cartTotal,
    addresses,
    saveAddress,
    checkoutDraft: form,
    setCheckoutDraft: setForm,
    payMethod,
    setPayMethod,
    upiId,
    setUpiId,
    checkoutSubmitNonce,
    createOrder,
    clearCart,
    refreshOrders,
    navigate,
    pushChip,
  } = useVibeCart();

  const liveGatewayReady = isRazorpayConfigured;
  const defaultAddr = addresses[0];
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [launchingGateway, setLaunchingGateway] = useState(false);
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [paymentError, setPaymentError] = useState('');

  const validateForm = useCallback((): boolean => {
    const next: FormErrors = {};
    if (form.name.trim().length < 2) next.name = 'Enter recipient full name';
    if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ''))) {
      next.phone = 'Enter a valid 10-digit mobile number';
    }
    if (form.line1.trim().length < 5) next.line1 = 'Enter street address and flat/house number';
    if (form.city.trim().length < 2) next.city = 'Enter city';
    if (form.state.trim().length < 2) next.state = 'Enter state';
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = 'Enter a 6-digit PIN code';

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const submitCheckout = useCallback(async () => {
    if (!validateForm()) return;
    setPaymentError('');

    if (liveGatewayReady) {
      setLaunchingGateway(true);
      const address: Address = { id: `addr-${Date.now()}`, ...form };
      saveAddress(address);
      await launchRazorpayCheckout(address, cart, {
        onSuccess: async (payload) => {
          setLaunchingGateway(false);
          if (payload.createdVia === 'edge' && isSupabaseConfigured) {
            clearCart();
            await refreshOrders();
            pushChip({
              type: 'success',
              text: `Order ${payload.orderCode ?? payload.orderId} confirmed`,
            });
          } else {
            createOrder(address, payload.razorpayPaymentId, payload.razorpayOrderId);
          }
          navigate('orders');
        },
        onError: (msg) => {
          setLaunchingGateway(false);
          setPaymentError(msg);
          pushChip({ type: 'error', text: msg });
        },
      });
      return;
    }

    setPaymentModalOpen(true);
  }, [
    cart,
    clearCart,
    createOrder,
    form,
    liveGatewayReady,
    navigate,
    pushChip,
    refreshOrders,
    saveAddress,
    validateForm,
  ]);

  useEffect(() => {
    if (checkoutSubmitNonce > 0 && cart.length > 0) {
      submitCheckout();
    }
  }, [checkoutSubmitNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cart.length === 0) {
    return (
      <div className="rounded-[20px] vc-glass p-10 text-center max-w-xl mx-auto space-y-4">
        <h1 className="font-display text-2xl font-semibold text-[#F5F5F5]">
          No items ready for checkout
        </h1>
        <p className="text-sm text-[#9A9A9A]">
          Add an item to your cart first before starting checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('results')}
          className="h-12 px-6 rounded-[14px] bg-white text-[#050505] text-sm font-semibold cursor-pointer"
        >
          Browse Gear
        </button>
      </div>
    );
  }

  const handleContinueToPay = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCheckout();
  };

  const applySavedAddress = (addr: Address) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setErrors({});
  };

  const handleSaveCurrentAddress = async () => {
    if (!validateForm()) return;
    await saveAddress({
      name: form.name,
      phone: form.phone.replace(/\s+/g, ''),
      line1: form.line1,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      isDefault: true,
    });
  };

  const completePayment = (simulateSuccess: boolean) => {
    if (!simulateSuccess) {
      setPaymentError('Bank declined test transaction. Try the test card 4111 1111 1111 1111.');
      pushChip({ type: 'error', text: 'Payment failed in Test Mode' });
      return;
    }

    const address: Address = {
      id: `addr-${Date.now()}`,
      ...form,
      isDefault: true,
    };
    saveAddress(address);
    const rpOrderId = `order_rzp_${Date.now()}`;
    const rpPayId = `pay_rzp_${Math.floor(100000 + Math.random() * 899999)}`;
    createOrder(address, rpPayId, rpOrderId);
    setPaymentModalOpen(false);
    navigate('orders');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
          Checkout
        </h1>
        <p className="text-sm text-[#9A9A9A] mt-1">
          {liveGatewayReady
            ? 'Confirm delivery details to launch verified Razorpay Checkout.'
            : 'Confirm delivery details before opening Razorpay Test Mode checkout.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Address Form */}
        <form
          onSubmit={handleContinueToPay}
          noValidate
          className="lg:col-span-7 min-w-0 rounded-[20px] vc-glass p-5 sm:p-8 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
              Delivery Address
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCurrentAddress}
                className="h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-xs font-medium text-[#F5F5F5] hover:border-[#2EE59D] hover:text-[#2EE59D] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Address</span>
              </button>
              {defaultAddr && (
                <button
                  type="button"
                  onClick={() => applySavedAddress(defaultAddr)}
                  className="h-9 px-3 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-xs font-medium text-[#FFA040] hover:border-[#FF6A00] cursor-pointer"
                >
                  Fill Saved ({defaultAddr.city})
                </button>
              )}
            </div>
          </div>

          {addresses.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => applySavedAddress(addr)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#9A9A9A] hover:text-white hover:border-[#FF6A00] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {addr.name.split(' ')[0]} · {addr.city} ({addr.pincode})
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="chk-name" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                Full Name
              </label>
              <input
                id="chk-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Aarav Sharma"
                className="w-full h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/15 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.name && <p className="text-xs text-[#FF4D5E] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="chk-phone" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                Mobile Number
              </label>
              <input
                id="chk-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/15 text-sm text-[#F5F5F5] font-mono-num focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.phone && <p className="text-xs text-[#FF4D5E] mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="chk-line1" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
              Street Address
            </label>
            <input
              id="chk-line1"
              type="text"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              placeholder="House/Flat No., Building, Street"
              className="w-full h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/15 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
            />
            {errors.line1 && <p className="text-xs text-[#FF4D5E] mt-1">{errors.line1}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="chk-city" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                City
              </label>
              <input
                id="chk-city"
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Bengaluru"
                className="w-full h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/15 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.city && <p className="text-xs text-[#FF4D5E] mt-1">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="chk-state" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                State
              </label>
              <input
                id="chk-state"
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="Karnataka"
                className="w-full h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/15 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.state && <p className="text-xs text-[#FF4D5E] mt-1">{errors.state}</p>}
            </div>

            <div>
              <label htmlFor="chk-pin" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                PIN Code
              </label>
              <input
                id="chk-pin"
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                placeholder="560038"
                className="w-full h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/15 text-sm text-[#F5F5F5] font-mono-num focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.pincode && <p className="text-xs text-[#FF4D5E] mt-1">{errors.pincode}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={launchingGateway}
            className="w-full h-12 px-6 rounded-[14px] bg-white text-[#050505] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#F5F5F5] hover:shadow-[0_0_24px_rgba(255,160,64,0.3)] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>
              {launchingGateway
                ? 'Opening Razorpay...'
                : liveGatewayReady
                  ? `Pay ₹${cartTotal.toLocaleString('en-IN')} with Razorpay`
                  : `Pay ₹${cartTotal.toLocaleString('en-IN')} with Razorpay Test Mode`}
            </span>
          </button>
          {paymentError && !paymentModalOpen && (
            <p className="text-xs text-[#FF4D5E] bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 rounded-xl p-3">
              {paymentError}
            </p>
          )}
        </form>

        {/* Summary Sidebar */}
        <aside className="lg:col-span-5 min-w-0 rounded-[20px] vc-glass p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
            Items in Order
          </h2>
          <div className="divide-y divide-white/10">
            {cart.map((item) => {
              const p = products.find((c) => c.id === item.productId);
              if (!p) return null;
              return (
                <div
                  key={`${item.productId}-${item.variantName}`}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#F5F5F5] truncate">{p.title}</p>
                    <p className="text-xs text-[#9A9A9A]">
                      {item.variantName} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono-num text-[#F5F5F5] tabular-nums shrink-0">
                    ₹{(p.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-[#9A9A9A]">
              <span>Subtotal</span>
              <span className="font-mono-num text-[#F5F5F5] tabular-nums">
                ₹{cartSubtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-[#9A9A9A]">
              <span>Shipping</span>
              <span className="font-mono-num text-[#2EE59D] tabular-nums">
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 font-display text-base font-semibold text-[#F5F5F5]">
              <span>Payable Total</span>
              <span className="font-mono-num text-xl tabular-nums">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-[#9A9A9A] pt-1">
            <ShieldCheck className="w-4 h-4 text-[#2EE59D] shrink-0 mt-0.5" />
            <span>
              {liveGatewayReady
                ? 'Razorpay Checkout active: order totals and payment signatures are verified via Supabase Edge Functions.'
                : 'Test Mode simulation: no real funds are charged. Card details are handled inside the payment modal only.'}
            </span>
          </div>
        </aside>
      </div>

      {/* Razorpay Test Mode Checkout Modal */}
      {paymentModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Razorpay Test Payment Gateway"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-[24px] bg-[#111111] border border-white/15 shadow-2xl">
            <div className="bg-gradient-to-r from-[#FF6A00] to-[#E34A00] p-5 flex items-center justify-between text-[#050505]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  Razorpay Test Mode
                </p>
                <p className="font-display text-xl font-bold tabular-nums">
                  VoicoCart · ₹{cartTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close payment modal"
                onClick={() => setPaymentModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`h-11 rounded-[14px] border text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                    payMethod === 'card'
                      ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                      : 'border-white/10 bg-white/5 text-[#9A9A9A]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Test Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('upi')}
                  className={`h-11 rounded-[14px] border text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                    payMethod === 'upi'
                      ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                      : 'border-white/10 bg-white/5 text-[#9A9A9A]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Test UPI</span>
                </button>
              </div>

              {payMethod === 'card' ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="rzp-card" className="block text-xs text-[#9A9A9A] mb-1">
                      Test Card Number
                    </label>
                    <input
                      id="rzp-card"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-[#050505] border border-white/15 font-mono-num text-sm text-[#F5F5F5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-[#9A9A9A]">
                    <div className="rounded-xl bg-[#050505] border border-white/10 p-2.5">
                      Expiry: <span className="text-[#F5F5F5] font-mono-num">12/29</span>
                    </div>
                    <div className="rounded-xl bg-[#050505] border border-white/10 p-2.5">
                      CVV: <span className="text-[#F5F5F5] font-mono-num">123</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="rzp-upi" className="block text-xs text-[#9A9A9A] mb-1">
                    Test UPI ID
                  </label>
                  <input
                    id="rzp-upi"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#050505] border border-white/15 font-mono-num text-sm text-[#F5F5F5]"
                  />
                </div>
              )}

              {paymentError && (
                <p className="text-xs text-[#FF4D5E] bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 rounded-xl p-3">
                  {paymentError}
                </p>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => completePayment(true)}
                  className="w-full h-12 rounded-[14px] bg-white text-[#050505] text-sm font-semibold hover:bg-[#F5F5F5] cursor-pointer"
                >
                  Confirm Payment Success
                </button>
                <button
                  type="button"
                  onClick={() => completePayment(false)}
                  className="w-full h-10 rounded-[14px] bg-white/5 border border-white/10 text-xs font-medium text-[#9A9A9A] hover:text-[#FF4D5E] cursor-pointer"
                >
                  Simulate Bank Failure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
