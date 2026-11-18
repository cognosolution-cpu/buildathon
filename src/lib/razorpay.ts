import type { Address, CartItem } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const publicRazorpayKey = (import.meta.env.VITE_RAZORPAY_KEY_ID ?? '').trim();

export const isRazorpayConfigured = Boolean(publicRazorpayKey);

export interface RazorpaySuccessPayload {
  orderId: string;
  orderCode?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdVia: 'edge' | 'server';
}

export async function launchRazorpayCheckout(
  address: Address,
  items: CartItem[],
  callbacks: {
    onSuccess: (payload: RazorpaySuccessPayload) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  if (typeof window === 'undefined' || !window.Razorpay) {
    callbacks.onError('Razorpay Checkout SDK has not loaded yet. Please retry.');
    return;
  }

  let orderPayload: {
    orderId: string;
    orderCode?: string;
    razorpayOrderId: string;
    amount: number;
    keyId: string;
    createdVia: 'edge' | 'server';
  } | null = null;

  // 1. Try Supabase Edge Function if configured and user has an active session
  const client = isSupabaseConfigured ? supabase : null;
  if (client) {
    const { data: sessionRes } = await client.auth.getSession();
    if (sessionRes.session?.access_token) {
      const { data, error } = await client.functions.invoke('create-razorpay-order', {
        body: { address },
      });
      if (!error && data?.razorpayOrderId) {
        orderPayload = {
          orderId: data.orderId,
          orderCode: data.orderCode,
          razorpayOrderId: data.razorpayOrderId,
          amount: data.amount,
          keyId: data.keyId ?? publicRazorpayKey,
          createdVia: 'edge',
        };
      }
    }
  }

  // 2. Fallback to Express server-side /api/razorpay/create-order (computes prices server-side)
  if (!orderPayload) {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, items }),
    });
    const data = await res.json();
    if (!res.ok || !data?.razorpayOrderId) {
      callbacks.onError(data?.error ?? 'Could not initialize Razorpay order.');
      return;
    }
    orderPayload = {
      orderId: data.orderId,
      orderCode: data.orderId,
      razorpayOrderId: data.razorpayOrderId,
      amount: data.amount,
      keyId: data.keyId ?? publicRazorpayKey,
      createdVia: 'server',
    };
  }

  const activeOrder = orderPayload;

  const options = {
    key: activeOrder.keyId,
    amount: activeOrder.amount,
    currency: 'INR',
    name: 'VibeCart',
    description: 'Voice Commerce Order',
    order_id: activeOrder.razorpayOrderId,
    prefill: {
      name: address.name,
      contact: address.phone,
    },
    theme: {
      color: '#FF6A00',
    },
    handler: async (resp: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      if (activeOrder.createdVia === 'edge' && client) {
        const verifyRes = await client.functions.invoke('verify-payment', {
          body: resp,
        });
        if (verifyRes.error || !verifyRes.data?.ok) {
          callbacks.onError(verifyRes.error?.message ?? 'Payment signature verification failed.');
          return;
        }
      } else {
        const verifyRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resp),
        });
        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok || !verifyJson?.ok) {
          callbacks.onError(verifyJson?.error ?? 'Payment signature verification failed.');
          return;
        }
      }

      callbacks.onSuccess({
        orderId: activeOrder.orderId,
        orderCode: activeOrder.orderCode,
        razorpayOrderId: resp.razorpay_order_id,
        razorpayPaymentId: resp.razorpay_payment_id,
        createdVia: activeOrder.createdVia,
      });
    },
    modal: {
      ondismiss: () => {
        callbacks.onError('Payment modal dismissed before completion.');
      },
    },
  };

  const instance = new window.Razorpay(options);
  instance.open();
}
