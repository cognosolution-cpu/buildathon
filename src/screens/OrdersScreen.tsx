import React, { useState } from 'react';
import { Check, Package, RotateCcw, Truck } from 'lucide-react';
import { useVibeCart } from '../state/store';
import type { Order, OrderStatus } from '../types';

const STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'paid', label: 'Paid' },
  { status: 'packed', label: 'Packed' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
];

const RETURN_REASONS = [
  'Wrong size / fit',
  'Defective or damaged item',
  'Audio quality not as expected',
  'Ordered by mistake',
];

export const OrdersScreen: React.FC = () => {
  const { orders, advanceOrderStatus, submitReturn, navigate } = useVibeCart();
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);

  if (orders.length === 0) {
    return (
      <div className="rounded-[20px] vc-glass p-10 text-center max-w-xl mx-auto space-y-4">
        <Package className="w-10 h-10 text-[#FF6A00] mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-[#F5F5F5]">No orders yet</h1>
        <p className="text-sm text-[#9A9A9A]">
          Complete checkout to track your live order milestones here.
        </p>
        <button
          type="button"
          onClick={() => navigate('results')}
          className="h-12 px-6 rounded-[14px] bg-white text-[#050505] text-sm font-semibold cursor-pointer"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
          Orders & Live Tracking
        </h1>
        <p className="text-sm text-[#9A9A9A] mt-1">
          Simulated shipping timeline with instant status progression and voice returns.
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const currentIdx = STEPS.findIndex((s) => s.status === order.status);
          const isReturned = order.status === 'returned';

          return (
            <article key={order.id} className="rounded-[20px] vc-glass p-6 space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#9A9A9A]">
                    <span className="font-mono-num text-[#F5F5F5] font-semibold">
                      {order.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={isReturned ? 'text-[#FF4D5E]' : 'text-[#4DA3FF]'}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-[#9A9A9A] mt-1">
                    Delivering to {order.address.name}, {order.address.city}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono-num text-lg font-bold text-[#F5F5F5] tabular-nums mr-2">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>

                  {!isReturned && order.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={() => advanceOrderStatus(order.id)}
                      className="h-10 px-3.5 rounded-[14px] bg-[#4DA3FF]/15 border border-[#4DA3FF]/40 text-xs font-semibold text-[#4DA3FF] hover:bg-[#4DA3FF]/25 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Advance Shipping Stage</span>
                    </button>
                  )}

                  {!isReturned && (
                    <button
                      type="button"
                      onClick={() => setReturningOrder(order)}
                      className="h-10 px-3.5 rounded-[14px] bg-white/5 border border-white/10 text-xs font-medium text-[#F5F5F5] hover:border-[#FF6A00] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return Item</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tracking Stepper */}
              {!isReturned && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {STEPS.map((step, idx) => {
                    const completed = currentIdx >= idx;
                    const active = currentIdx === idx;
                    return (
                      <div
                        key={step.status}
                        className={`rounded-[14px] p-3 border transition-colors ${
                          active
                            ? 'bg-[#4DA3FF]/15 border-[#4DA3FF]/60'
                            : completed
                              ? 'bg-[#2EE59D]/10 border-[#2EE59D]/30'
                              : 'bg-[#0B0B0B] border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono-num text-[#9A9A9A]">
                            0{idx + 1}
                          </span>
                          {completed && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                active ? 'text-[#4DA3FF]' : 'text-[#2EE59D]'
                              }`}
                            />
                          )}
                        </div>
                        <p
                          className={`text-xs font-semibold ${
                            completed ? 'text-[#F5F5F5]' : 'text-[#9A9A9A]'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Return Confirmation Banner */}
              {order.returnRequest && (
                <div className="rounded-[14px] bg-[#2EE59D]/10 border border-[#2EE59D]/30 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#2EE59D]">
                      Return Approved · {order.returnRequest.id}
                    </p>
                    <p className="text-sm text-[#F5F5F5] mt-0.5">
                      {order.returnRequest.itemTitle} — Reason: {order.returnRequest.reason}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#2EE59D] shrink-0">
                    Refund initiated
                  </span>
                </div>
              )}

              {/* Order Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item) => (
                  <div
                    key={`${order.id}-${item.productId}-${item.variantName}`}
                    className="flex items-center gap-3 rounded-[14px] bg-[#0B0B0B] border border-white/10 p-3"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#F5F5F5] truncate">{item.title}</p>
                      <p className="text-xs text-[#9A9A9A]">
                        {item.variantName} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono-num text-sm font-semibold text-[#F5F5F5] tabular-nums">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Event Log */}
              <div className="pt-2 space-y-1.5">
                {order.events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-xs text-[#9A9A9A]">
                    <span>{ev.note}</span>
                    <span className="font-mono-num tabular-nums">
                      {new Date(ev.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* Return Modal */}
      {returningOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Initiate product return"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-[24px] bg-[#111111] border border-white/15 p-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#F5F5F5]">
                Return Item from {returningOrder.id}
              </h2>
              <p className="text-xs text-[#9A9A9A] mt-1">
                {returningOrder.items[0]?.title}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[#9A9A9A]">Select reason</p>
              {RETURN_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReturnReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-[14px] border text-sm transition-colors cursor-pointer ${
                    returnReason === reason
                      ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                      : 'border-white/10 bg-[#0B0B0B] text-[#9A9A9A]'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReturningOrder(null)}
                className="flex-1 h-11 rounded-[14px] bg-white/5 border border-white/10 text-sm text-[#9A9A9A] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const title = returningOrder.items[0]?.title ?? 'Order item';
                  submitReturn(returningOrder.id, title, returnReason);
                  setReturningOrder(null);
                }}
                className="flex-1 h-11 rounded-[14px] bg-white text-[#050505] text-sm font-semibold hover:bg-[#F5F5F5] cursor-pointer"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
