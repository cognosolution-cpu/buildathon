import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, searchCatalog } from '../data/catalog';
import {
  ensureSupabaseSession,
  fetchSupabaseCatalog,
  fetchSupabaseOrders,
  getOrCreateActiveCartId,
  isSupabaseConfigured,
  searchSupabaseProducts,
  supabase,
} from '../lib/supabase';
import { LANGUAGES, t } from '../nlu/i18n';
import { understand } from '../nlu/nluRouter';
import { buildComparison } from '../nlu/compareLogic';
import { speakReply, stopSpeaking } from '../voice/speech';
import { AgoraVoiceSession } from '../voice/agoraVoice';
import type {
  ActionChip,
  Address,
  CartItem,
  LangCode,
  Order,
  OrderStatus,
  Product,
  ProductRef,
  RouteName,
  VoiceGender,
  VoiceStatus,
} from '../types';

const STORAGE_KEY = 'vibecart_state_v1';

interface PersistedState {
  lang: LangCode;
  voiceGender: VoiceGender;
  cart: CartItem[];
  orders: Order[];
  addresses: Address[];
  simpleView: boolean;
  compareIds: string[];
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const cleanOrders = Array.isArray(parsed.orders)
        ? parsed.orders.filter((o) => o.razorpayOrderId !== 'order_demo_1042')
        : [];
      const cleanAddresses = Array.isArray(parsed.addresses)
        ? parsed.addresses.filter((a) => a.id !== 'addr-default-1')
        : [];
      return {
        lang: parsed.lang ?? 'en-IN',
        voiceGender: parsed.voiceGender === 'male' ? 'male' : 'female',
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        orders: cleanOrders,
        addresses: cleanAddresses,
        simpleView: Boolean(parsed.simpleView),
        compareIds:
          Array.isArray(parsed.compareIds) && parsed.compareIds.length >= 2
            ? parsed.compareIds
            : [CATALOG[0].id, CATALOG[1].id],
      };
    }
  } catch {
    // Ignore storage errors
  }
  return {
    lang: 'en-IN',
    voiceGender: 'female',
    cart: [],
    orders: [],
    addresses: [],
    simpleView: false,
    compareIds: [CATALOG[0].id, CATALOG[1].id],
  };
}

function parseHash(): { route: RouteName; productId: string | null } {
  if (typeof window === 'undefined') return { route: 'home', productId: null };
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { route: 'home', productId: null };
  const [segment, param] = hash.split('/');
  if (segment === 'product' && param) {
    return { route: 'product', productId: param };
  }
  const valid: RouteName[] = ['home', 'results', 'product', 'compare', 'cart', 'checkout', 'orders', 'profile'];
  if (valid.includes(segment as RouteName)) {
    return { route: segment as RouteName, productId: segment === 'product' ? CATALOG[0].id : null };
  }
  return { route: 'home', productId: null };
}

export interface SearchCriteria {
  query: string;
  category: Product['category'] | 'all';
  maxPrice: number | null;
}

export type AuthMode = 'sandbox' | 'anonymous' | 'authenticated';

interface VibeCartContextValue {
  products: Product[];
  authUserId: string | null;
  authMode: AuthMode;
  authEmail: string | null;
  signInWithGoogle: () => Promise<{ ok: boolean; message: string }>;
  signInWithMagicLink: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOutSupabase: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  route: RouteName;
  focusedProductId: string;
  navigate: (route: RouteName, productId?: string) => void;
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  voiceGender: VoiceGender;
  setVoiceGender: (gender: VoiceGender) => void;
  simpleView: boolean;
  setSimpleView: (simple: boolean) => void;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  cartTotal: number;
  lastAddedPulse: number;
  addToCart: (productId: string, quantity?: number, variantName?: string) => void;
  removeFromCart: (productId: string, variantName?: string) => void;
  updateQuantity: (productId: string, variantName: string, quantity: number) => void;
  clearCart: () => void;
  lastResults: Product[];
  searchCriteria: SearchCriteria;
  applySearch: (criteria: Partial<SearchCriteria>, goToResults?: boolean) => Product[];
  compareIds: string[];
  toggleCompareId: (productId: string) => void;
  setCompareIds: (ids: string[]) => void;
  orders: Order[];
  createOrder: (address: Address, paymentId: string, razorpayOrderId: string) => Order;
  advanceOrderStatus: (orderId: string) => void;
  submitReturn: (orderId: string, itemTitle: string, reason: string) => void;
  addresses: Address[];
  saveAddress: (address: Address) => void;
  voiceStatus: VoiceStatus;
  setVoiceStatus: React.Dispatch<React.SetStateAction<VoiceStatus>>;
  transcript: string;
  setTranscript: (text: string) => void;
  assistantReply: string;
  voiceOverlayOpen: boolean;
  setVoiceOverlayOpen: (open: boolean) => void;
  agoraActive: boolean;
  agoraMuted: boolean;
  agoraVoiceName: string;
  startAgoraVoice: () => Promise<boolean>;
  stopAgoraVoice: () => Promise<void>;
  toggleAgoraMute: () => Promise<void>;
  chips: ActionChip[];
  pushChip: (chip: Omit<ActionChip, 'id'>) => void;
  dismissChip: (id: string) => void;
  runVoiceCommand: (text: string, options?: { speak?: boolean }) => Promise<void>;
}

const VibeCartContext = createContext<VibeCartContextValue | null>(null);

const ORDER_SEQUENCE: OrderStatus[] = ['paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const ORDER_STATUS_NOTES: Record<OrderStatus, string> = {
  paid: 'Payment confirmed',
  packed: 'Quality checked & packed at fulfillment center',
  shipped: 'Handed over to express air courier',
  out_for_delivery: 'Out for delivery with local courier partner',
  delivered: 'Delivered to customer address',
  returned: 'Return pickup scheduled',
};

export const VibeCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialPersisted = useMemo(() => loadPersisted(), []);
  const initialRoute = useMemo(() => parseHash(), []);

  const [products, setProducts] = useState<Product[]>(CATALOG);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('sandbox');
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const [route, setRoute] = useState<RouteName>(initialRoute.route);
  const [focusedProductId, setFocusedProductId] = useState<string>(
    initialRoute.productId ?? CATALOG[0].id
  );
  const [lang, setLangState] = useState<LangCode>(initialPersisted.lang);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(initialPersisted.voiceGender);
  const [cart, setCart] = useState<CartItem[]>(initialPersisted.cart);
  const [orders, setOrders] = useState<Order[]>(initialPersisted.orders);
  const [addresses, setAddresses] = useState<Address[]>(initialPersisted.addresses);
  const [simpleView, setSimpleView] = useState<boolean>(initialPersisted.simpleView);
  const [compareIds, setCompareIds] = useState<string[]>(initialPersisted.compareIds);

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    query: '',
    category: 'all',
    maxPrice: null,
  });
  const [lastResults, setLastResults] = useState<Product[]>(CATALOG);

  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState<boolean>(false);
  const [agoraActive, setAgoraActive] = useState<boolean>(false);
  const [agoraMuted, setAgoraMuted] = useState<boolean>(false);
  const [agoraVoiceName, setAgoraVoiceName] = useState<string>('');
  const [chips, setChips] = useState<ActionChip[]>([]);
  const [lastAddedPulse, setLastAddedPulse] = useState<number>(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ type: 'CHECKOUT' } | null>(null);

  const productsRef = useRef<Product[]>(products);
  productsRef.current = products;
  const agoraSessionRef = useRef<AgoraVoiceSession | null>(null);

  // Persist core user data locally
  useEffect(() => {
    try {
      const payload: PersistedState = {
        lang,
        voiceGender,
        cart,
        orders,
        addresses,
        simpleView,
        compareIds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota issues
    }
  }, [lang, voiceGender, cart, orders, addresses, simpleView, compareIds]);

  const dismissChip = useCallback((id: string) => {
    setChips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const pushChip = useCallback((chip: Omit<ActionChip, 'id'>) => {
    const id = `chip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setChips((prev) => [...prev.slice(-2), { ...chip, id }]);
    window.setTimeout(() => {
      setChips((prev) => prev.filter((c) => c.id !== id));
    }, 3600);
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !authUserId) return;
    const remoteOrders = await fetchSupabaseOrders(authUserId);
    if (remoteOrders && remoteOrders.length > 0) {
      setOrders(remoteOrders);
    }
  }, [authUserId]);

  // Boot Supabase session, catalog hydration, user state, and Realtime subscription when configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let cancelled = false;

    const hydrateFromSupabase = async () => {
      const remoteProducts = await fetchSupabaseCatalog();
      if (!cancelled && remoteProducts && remoteProducts.length > 0) {
        const byId = new Map(CATALOG.map((p) => [p.id, p]));
        for (const rp of remoteProducts) {
          byId.set(rp.id, rp);
        }
        const merged = Array.from(byId.values());
        setProducts(merged);
        setLastResults(merged);
      }

      const userId = await ensureSupabaseSession();
      if (cancelled || !userId || !supabase) return;

      setAuthUserId(userId);
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      setAuthEmail(user?.email ?? null);
      setAuthMode(user?.is_anonymous ? 'anonymous' : 'authenticated');

      // Hydrate orders
      const remoteOrders = await fetchSupabaseOrders(userId);
      if (!cancelled && remoteOrders && remoteOrders.length > 0) {
        setOrders(remoteOrders);
      }

      // Hydrate saved addresses
      const { data: addrRows } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!cancelled && addrRows && addrRows.length > 0) {
        setAddresses(
          addrRows.map((a) => ({
            id: String(a.id),
            name: String(a.name),
            phone: String(a.phone),
            line1: String(a.line1),
            city: String(a.city),
            state: String(a.state),
            pincode: String(a.pincode),
            isDefault: Boolean(a.is_default),
          }))
        );
      }

      // Hydrate active cart items
      const cartId = await getOrCreateActiveCartId(userId);
      if (!cancelled && cartId) {
        const { data: cartRows } = await supabase
          .from('cart_items')
          .select('quantity, variant_name, products(slug)')
          .eq('cart_id', cartId);

        if (!cancelled && cartRows && cartRows.length > 0) {
          const mappedCart: CartItem[] = cartRows
            .map((row) => {
              const prod = row.products as { slug?: string } | null;
              if (!prod?.slug) return null;
              return {
                productId: prod.slug,
                quantity: Number(row.quantity),
                variantName: String(row.variant_name ?? 'Standard'),
              };
            })
            .filter((item): item is CartItem => item !== null);
          if (mappedCart.length > 0) {
            setCart(mappedCart);
          }
        }
      }
    };

    hydrateFromSupabase();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUserId(session.user.id);
        setAuthEmail(session.user.email ?? null);
        setAuthMode(session.user.is_anonymous ? 'anonymous' : 'authenticated');
      } else {
        setAuthUserId(null);
        setAuthEmail(null);
        setAuthMode('sandbox');
      }
    });

    // Subscribe to live order tracking updates via Supabase Realtime
    const channel = supabase
      .channel('order-events-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_events' },
        (payload) => {
          const status = String((payload.new as { status?: string })?.status ?? '');
          if (status) {
            pushChip({
              type: 'info',
              text: `Live order update: ${status.replace(/_/g, ' ')}`,
            });
          }
          if (authUserId) {
            fetchSupabaseOrders(authUserId).then((next) => {
              if (next && next.length > 0) setOrders(next);
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      supabase?.removeChannel(channel);
    };
  }, [authUserId, pushChip]);

  // Listen to browser hash navigation
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setRoute(parsed.route);
      if (parsed.productId) setFocusedProductId(parsed.productId);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((nextRoute: RouteName, productId?: string) => {
    if (productId) {
      setFocusedProductId(productId);
    }
    setRoute(nextRoute);
    const fallbackProd = productsRef.current[0]?.id ?? CATALOG[0].id;
    const nextHash =
      nextRoute === 'home'
        ? '#/'
        : nextRoute === 'product'
          ? `#/product/${productId ?? fallbackProd}`
          : `#/${nextRoute}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setLang = useCallback(
    (nextLang: LangCode) => {
      setLangState(nextLang);
      document.documentElement.lang = nextLang.split('-')[0];
      if (isSupabaseConfigured && supabase && authUserId) {
        supabase
          .from('profiles')
          .upsert({ id: authUserId, preferred_lang: nextLang })
          .then(() => undefined);
      }
    },
    [authUserId]
  );

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart, products]);

  const shippingFee = cartSubtotal === 0 || cartSubtotal > 999 ? 0 : 49;
  const cartTotal = cartSubtotal + shippingFee;

  const syncCartItemToSupabase = useCallback(
    async (productId: string, variantName: string, quantity: number) => {
      if (!isSupabaseConfigured || !supabase || !authUserId) return;
      const prod = productsRef.current.find((p) => p.id === productId);
      if (!prod?.dbUuid) return;
      const cartId = await getOrCreateActiveCartId(authUserId);
      if (!cartId) return;

      if (quantity <= 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId)
          .eq('product_id', prod.dbUuid)
          .eq('variant_name', variantName);
      } else {
        await supabase.from('cart_items').upsert(
          {
            cart_id: cartId,
            product_id: prod.dbUuid,
            variant_name: variantName,
            quantity: Math.min(10, quantity),
          },
          { onConflict: 'cart_id,product_id,variant_name' }
        );
      }
    },
    [authUserId]
  );

  const removeFromCart = useCallback(
    (productId: string, variantName?: string) => {
      const product = productsRef.current.find((p) => p.id === productId);
      setCart((prev) =>
        prev.filter((item) =>
          variantName
            ? !(item.productId === productId && item.variantName === variantName)
            : item.productId !== productId
        )
      );
      if (variantName) {
        syncCartItemToSupabase(productId, variantName, 0);
      } else if (product?.dbUuid && isSupabaseConfigured && supabase && authUserId) {
        getOrCreateActiveCartId(authUserId).then((cartId) => {
          if (cartId && supabase && product.dbUuid) {
            supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', product.dbUuid);
          }
        });
      }
      if (product) {
        pushChip({ type: 'info', text: t(lang, 'removedReply', { title: product.title }) });
      }
    },
    [authUserId, lang, pushChip, syncCartItemToSupabase]
  );

  const addToCart = useCallback(
    (productId: string, quantity = 1, variantName?: string) => {
      const product = productsRef.current.find((p) => p.id === productId);
      if (!product) return;
      const chosenVariant = variantName ?? product.variants[0]?.name ?? 'Standard';
      let nextQty = quantity;

      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.productId === productId && i.variantName === chosenVariant
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          nextQty = Math.min(10, next[existingIdx].quantity + quantity);
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: nextQty,
          };
          return next;
        }
        nextQty = Math.min(10, quantity);
        return [...prev, { productId, quantity: nextQty, variantName: chosenVariant }];
      });

      syncCartItemToSupabase(productId, chosenVariant, nextQty);
      setLastAddedPulse((n) => n + 1);
      pushChip({
        type: 'success',
        text: t(lang, 'addedReply', { title: product.title }),
        undoLabel: 'Undo',
        onUndo: () => {
          setCart((prev) => {
            const idx = prev.findIndex(
              (i) => i.productId === productId && i.variantName === chosenVariant
            );
            if (idx < 0) return prev;
            if (prev[idx].quantity <= quantity) {
              syncCartItemToSupabase(productId, chosenVariant, 0);
              return prev.filter((_, i) => i !== idx);
            }
            const reduced = prev[idx].quantity - quantity;
            syncCartItemToSupabase(productId, chosenVariant, reduced);
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: reduced };
            return next;
          });
        },
      });
    },
    [lang, pushChip, syncCartItemToSupabase]
  );

  const updateQuantity = useCallback(
    (productId: string, variantName: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) =>
          prev.filter((i) => !(i.productId === productId && i.variantName === variantName))
        );
        syncCartItemToSupabase(productId, variantName, 0);
        return;
      }
      const clamped = Math.min(10, quantity);
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variantName === variantName
            ? { ...i, quantity: clamped }
            : i
        )
      );
      syncCartItemToSupabase(productId, variantName, clamped);
    },
    [syncCartItemToSupabase]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    if (isSupabaseConfigured && supabase && authUserId) {
      getOrCreateActiveCartId(authUserId).then((cartId) => {
        if (cartId && supabase) {
          supabase.from('cart_items').delete().eq('cart_id', cartId);
        }
      });
    }
  }, [authUserId]);

  const applySearch = useCallback(
    (partial: Partial<SearchCriteria>, goToResults = true): Product[] => {
      const next: SearchCriteria = {
        query: partial.query ?? searchCriteria.query,
        category: partial.category ?? searchCriteria.category,
        maxPrice: partial.maxPrice !== undefined ? partial.maxPrice : searchCriteria.maxPrice,
      };
      setSearchCriteria(next);
      const found = searchCatalog(
        {
          query: next.query,
          category: next.category,
          maxPrice: next.maxPrice ?? undefined,
        },
        productsRef.current
      );
      setLastResults(found);
      if (goToResults) navigate('results');

      if (isSupabaseConfigured) {
        searchSupabaseProducts(next).then((remoteFound) => {
          if (remoteFound && remoteFound.length > 0) {
            setLastResults(remoteFound);
          }
        });
      }

      return found;
    },
    [navigate, searchCriteria]
  );

  const toggleCompareId = useCallback((productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.length > 1 ? prev.filter((id) => id !== productId) : prev;
      }
      return [...prev.slice(-2), productId];
    });
  }, []);

  const createOrder = useCallback(
    (address: Address, paymentId: string, razorpayOrderId: string): Order => {
      const orderItems = cart
        .map((item) => {
          const p = productsRef.current.find((c) => c.id === item.productId);
          if (!p) return null;
          return {
            productId: p.id,
            title: p.title,
            price: p.price,
            quantity: item.quantity,
            variantName: item.variantName,
            imageUrl: p.imageUrl,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const shipping = subtotal === 0 || subtotal > 999 ? 0 : 49;
      const nowIso = new Date().toISOString();
      const newOrder: Order = {
        id: `VC-${Math.floor(1100 + Math.random() * 8800)}`,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        address,
        items: orderItems,
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: 'paid',
        createdAt: nowIso,
        events: [
          {
            id: `ev-${Date.now()}`,
            status: 'paid',
            note: 'Payment verified via Razorpay Test Mode',
            timestamp: nowIso,
          },
        ],
      };

      setOrders((prev) => [newOrder, ...prev]);
      clearCart();
      pushChip({ type: 'success', text: `Order ${newOrder.id} confirmed` });

      if (isSupabaseConfigured && supabase && authUserId) {
        (async () => {
          const { data: insertedOrder } = await supabase
            .from('orders')
            .insert({
              order_code: newOrder.id,
              user_id: authUserId,
              address,
              subtotal,
              shipping,
              total: subtotal + shipping,
              status: 'paid',
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: paymentId,
            })
            .select('id')
            .maybeSingle();

          if (insertedOrder?.id) {
            await supabase.from('order_items').insert(
              orderItems.map((it) => {
                const prod = productsRef.current.find((p) => p.id === it.productId);
                return {
                  order_id: insertedOrder.id,
                  product_id: prod?.dbUuid ?? null,
                  product_slug: it.productId,
                  title: it.title,
                  price: it.price,
                  quantity: it.quantity,
                  variant_name: it.variantName,
                  image_url: it.imageUrl,
                };
              })
            );
            await supabase.from('order_events').insert({
              order_id: insertedOrder.id,
              status: 'paid',
              note: 'Payment verified via Razorpay',
            });
          }
        })().catch(() => undefined);
      }

      return newOrder;
    },
    [authUserId, cart, clearCart, pushChip]
  );

  const advanceOrderStatus = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const idx = ORDER_SEQUENCE.indexOf(order.status);
          if (idx < 0 || idx >= ORDER_SEQUENCE.length - 1) return order;
          const nextStatus = ORDER_SEQUENCE[idx + 1];
          const event = {
            id: `ev-${Date.now()}`,
            status: nextStatus,
            note: ORDER_STATUS_NOTES[nextStatus],
            timestamp: new Date().toISOString(),
          };
          pushChip({
            type: 'info',
            text: `Order ${order.id}: ${nextStatus.replace(/_/g, ' ')}`,
          });
          return {
            ...order,
            status: nextStatus,
            events: [...order.events, event],
          };
        })
      );
    },
    [pushChip]
  );

  const submitReturn = useCallback(
    (orderId: string, itemTitle: string, reason: string) => {
      const nowIso = new Date().toISOString();
      const targetOrder = orders.find((o) => o.id === orderId);

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            status: 'returned',
            events: [
              ...order.events,
              {
                id: `ev-${Date.now()}`,
                status: 'returned',
                note: `Return requested (${reason})`,
                timestamp: nowIso,
              },
            ],
            returnRequest: {
              id: `RET-${Math.floor(100 + Math.random() * 899)}`,
              orderId,
              itemTitle,
              reason,
              status: 'approved',
              createdAt: nowIso,
            },
          };
        })
      );

      if (isSupabaseConfigured && supabase && authUserId && targetOrder?.dbUuid) {
        supabase
          .from('returns')
          .insert({
            user_id: authUserId,
            order_id: targetOrder.dbUuid,
            item_title: itemTitle,
            reason,
            status: 'approved',
          })
          .then(() => undefined);
      }

      pushChip({
        type: 'success',
        text: t(lang, 'returnConfirmedReply', { title: itemTitle }),
      });
    },
    [authUserId, lang, orders, pushChip]
  );

  const saveAddress = useCallback(
    (address: Address) => {
      setAddresses((prev) => {
        const filtered = prev.filter((a) => a.id !== address.id);
        return [address, ...filtered];
      });
      if (isSupabaseConfigured && supabase && authUserId) {
        supabase
          .from('addresses')
          .insert({
            user_id: authUserId,
            name: address.name,
            phone: address.phone,
            line1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            is_default: Boolean(address.isDefault),
          })
          .then(() => undefined);
      }
    },
    [authUserId]
  );

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: 'Configure Supabase env vars to enable Google Sign-In.' };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/profile`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase().includes('provider')
        ? 'Google Sign-In is not enabled yet in Supabase — use the email magic link below instead.'
        : error.message;
      return { ok: false, message: msg };
    }
    return { ok: true, message: 'Redirecting to Google Sign-In...' };
  }, []);

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<{ ok: boolean; message: string }> => {
      if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Configure Supabase env vars to enable email sign-in.' };
      }
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes('@')) {
        return { ok: false, message: 'Enter a valid email address.' };
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        return { ok: false, message: error.message };
      }
      return { ok: true, message: `Sign-in link sent to ${trimmed}. Check your inbox.` };
    },
    []
  );

  const signOutSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
    await ensureSupabaseSession();
    pushChip({ type: 'info', text: 'Signed out. Restored guest session.' });
  }, [pushChip]);

  const resolveRef = useCallback(
    (ref?: ProductRef): Product | null => {
      if (!ref) return null;
      const all = productsRef.current;
      if (ref.index) return lastResults[ref.index - 1] ?? all[ref.index - 1] ?? null;
      if (ref.id) return all.find((p) => p.id === ref.id) ?? null;
      if (ref.this) return all.find((p) => p.id === focusedProductId) ?? lastResults[0] ?? null;
      if (ref.name) {
        const lower = ref.name.toLowerCase();
        return (
          lastResults.find((p) => p.title.toLowerCase().includes(lower)) ??
          all.find(
            (p) =>
              p.title.toLowerCase().includes(lower) ||
              p.tags.some((tag) => lower.includes(tag))
          ) ??
          null
        );
      }
      return null;
    },
    [focusedProductId, lastResults]
  );

  const runVoiceCommand = useCallback(
    async (text: string, options: { speak?: boolean } = { speak: true }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setTranscript(trimmed);
      setVoiceStatus('thinking');

      const { parsed, replyHint } = await understand(trimmed, {
        screen: route,
        lang,
        cartCount,
        visibleProducts: lastResults.slice(0, 6).map((p, idx) => ({
          index: idx + 1,
          id: p.id,
          title: p.title,
          price: p.price,
        })),
      });

      let reply = '';
      const all = productsRef.current;

      switch (parsed.intent) {
        case 'CHANGE_LANGUAGE': {
          const nextLang = parsed.entities.lang ?? 'en-IN';
          setLang(nextLang);
          const langLabel = LANGUAGES.find((l) => l.code === nextLang)?.nativeLabel ?? nextLang;
          reply = t(nextLang, 'languageChangedReply', { lang: langLabel });
          pushChip({ type: 'info', text: reply });
          break;
        }

        case 'SEARCH_PRODUCTS':
        case 'RECOMMEND': {
          const query = parsed.entities.query ?? (parsed.intent === 'RECOMMEND' ? 'gift' : '');
          const category = parsed.entities.category ?? 'all';
          const maxPrice = parsed.entities.maxPrice ?? null;
          setSearchCriteria({ query, category, maxPrice });
          const matched = searchCatalog(
            {
              query,
              category,
              maxPrice: maxPrice ?? undefined,
            },
            all
          );
          if (matched.length > 0) {
            setLastResults(matched);
            reply = replyHint ?? t(lang, 'foundReply', { count: matched.length });
          } else {
            setLastResults(all.slice(0, 4));
            reply = t(lang, 'noResultsReply');
          }
          navigate('results');
          if (isSupabaseConfigured) {
            searchSupabaseProducts({ query, category, maxPrice }).then((remote) => {
              if (remote && remote.length > 0) setLastResults(remote);
            });
          }
          break;
        }

        case 'ASK_PRODUCT': {
          const target = resolveRef(parsed.entities.productRef) ?? lastResults[0] ?? all[0];
          navigate('product', target.id);
          const q = (parsed.entities.question ?? '').toLowerCase();
          if (q.includes('water')) {
            reply = `${target.title} features ${target.specs['Water Resistance'] ?? 'splash protection'}.`;
          } else if (q.includes('battery')) {
            reply = `${target.title} delivers ${target.specs.Battery ?? 'all-day battery life'}.`;
          } else if (q.includes('warranty')) {
            reply = `${target.title} includes a ${target.specs.Warranty ?? '1 Year'} manufacturer warranty.`;
          } else {
            reply =
              replyHint ??
              `${target.title} by ${target.brand} is ₹${target.price.toLocaleString('en-IN')} with a ${target.rating} star rating.`;
          }
          break;
        }

        case 'ADD_TO_CART': {
          const target = resolveRef(parsed.entities.productRef);
          if (!target) {
            reply = 'Which product would you like? Say a number from 1 to ' + lastResults.length + '.';
            pushChip({ type: 'error', text: 'Specify product number (1–' + lastResults.length + ')' });
          } else {
            const colorHint = parsed.entities.variant?.toLowerCase();
            const matchedVariant = colorHint
              ? target.variants.find((v) => v.name.toLowerCase().includes(colorHint))?.name
              : target.variants[0]?.name;
            addToCart(target.id, parsed.entities.quantity ?? 1, matchedVariant);
            reply = replyHint ?? t(lang, 'addedReply', { title: target.title });
          }
          break;
        }

        case 'REMOVE_FROM_CART': {
          const inCartProducts = cart
            .map((c) => all.find((p) => p.id === c.productId))
            .filter((p): p is Product => Boolean(p));
          const ref = parsed.entities.productRef;
          let target: Product | undefined;
          if (ref?.index) target = inCartProducts[ref.index - 1];
          else if (ref?.name) {
            const lower = ref.name.toLowerCase();
            target = inCartProducts.find(
              (p) =>
                p.title.toLowerCase().includes(lower) ||
                p.tags.some((tag) => lower.includes(tag))
            );
          } else {
            target = inCartProducts[0];
          }
          if (target) {
            removeFromCart(target.id);
            reply = t(lang, 'removedReply', { title: target.title });
          } else {
            reply = 'I could not find that item in your cart.';
          }
          break;
        }

        case 'UPDATE_QUANTITY': {
          const firstItem = cart[0];
          if (firstItem) {
            const qty = parsed.entities.quantity ?? 1;
            updateQuantity(firstItem.productId, firstItem.variantName, qty);
            const prod = all.find((p) => p.id === firstItem.productId);
            reply = `Updated ${prod?.title ?? 'item'} quantity to ${qty}.`;
            pushChip({ type: 'info', text: reply });
          } else {
            reply = t(lang, 'emptyCart');
          }
          break;
        }

        case 'COMPARE': {
          const refs = parsed.entities.productRefs ?? [];
          const resolved = refs
            .map((r) => resolveRef(r))
            .filter((p): p is Product => Boolean(p));
          const finalPair =
            resolved.length >= 2
              ? resolved.slice(0, 3)
              : lastResults.length >= 2
                ? lastResults.slice(0, 2)
                : all.slice(0, 2);
          setCompareIds(finalPair.map((p) => p.id));
          const comparison = buildComparison(finalPair);
          reply = comparison?.verdict ?? 'Opening comparison view.';
          navigate('compare');
          break;
        }

        case 'SHOW_CART': {
          navigate('cart');
          reply =
            cartCount > 0
              ? t(lang, 'cartSummaryReply', {
                  count: cartCount,
                  total: cartTotal.toLocaleString('en-IN'),
                })
              : t(lang, 'emptyCart');
          break;
        }

        case 'CHECKOUT': {
          if (cartCount === 0) {
            reply = t(lang, 'emptyCart');
            pushChip({ type: 'error', text: reply });
          } else {
            setPendingConfirmation({ type: 'CHECKOUT' });
            navigate('checkout');
            reply = t(lang, 'checkoutPromptReply', {
              total: cartTotal.toLocaleString('en-IN'),
            });
          }
          break;
        }

        case 'CONFIRM': {
          if (pendingConfirmation?.type === 'CHECKOUT') {
            setPendingConfirmation(null);
            navigate('checkout');
            reply = 'Checkout confirmed. Click Pay Now to complete your payment.';
          } else {
            reply = 'Confirmed.';
          }
          break;
        }

        case 'DENY': {
          if (pendingConfirmation) {
            setPendingConfirmation(null);
            reply = 'Cancelled that action. How else can I help?';
          } else {
            reply = 'Okay, cancelled.';
          }
          break;
        }

        case 'TRACK_ORDER': {
          navigate('orders');
          const latest = orders[0];
          reply = latest
            ? t(lang, 'orderStatusReply', { status: latest.status.replace(/_/g, ' ') })
            : 'You have no active orders yet.';
          break;
        }

        case 'RETURN_ITEM': {
          const latest = orders[0];
          if (!latest || latest.items.length === 0) {
            reply = 'No recent order found to return.';
            break;
          }
          const item = latest.items[0];
          const reason = parsed.entities.reason || 'Customer requested return';
          submitReturn(latest.id, item.title, reason);
          navigate('orders');
          reply = t(lang, 'returnConfirmedReply', { title: item.title });
          break;
        }

        case 'HELP': {
          reply =
            'Try saying: Show wireless earbuds under 2000, Add the second one, Compare 1 and 2, Show my cart, or Checkout.';
          break;
        }

        default: {
          reply = replyHint ?? t(lang, 'notUnderstoodReply');
          pushChip({ type: 'error', text: 'Try: "Show wireless earbuds under 2000"' });
        }
      }

      setAssistantReply(reply);
      setVoiceStatus(agoraActive ? 'listening' : 'speaking');
      if (options.speak !== false && !agoraActive) {
        speakReply(reply, lang, voiceGender);
      }
      window.setTimeout(() => {
        setVoiceStatus((cur) => (cur === 'speaking' ? 'idle' : cur));
      }, 900);
    },
    [
      addToCart,
      agoraActive,
      cart,
      cartCount,
      cartTotal,
      lang,
      lastResults,
      navigate,
      orders,
      pendingConfirmation,
      pushChip,
      removeFromCart,
      resolveRef,
      route,
      setLang,
      submitReturn,
      updateQuantity,
      voiceGender,
    ]
  );

  const runVoiceCommandRef = useRef(runVoiceCommand);
  runVoiceCommandRef.current = runVoiceCommand;

  const startAgoraVoice = useCallback(async (): Promise<boolean> => {
    stopSpeaking();
    if (!agoraSessionRef.current) {
      agoraSessionRef.current = new AgoraVoiceSession();
    }
    const session = agoraSessionRef.current;
    return session.start(
      {
        lang,
        voiceGender,
        context: { screen: route, cartCount },
      },
      {
        onConnecting: () => {
          setVoiceStatus('connecting');
          setAssistantReply('Connecting to Agora Voice AI & Murf Falcon 2...');
        },
        onConnected: ({ voiceDisplayName }) => {
          setAgoraActive(true);
          setAgoraMuted(false);
          setAgoraVoiceName(voiceDisplayName);
          setVoiceStatus('listening');
          pushChip({ type: 'info', text: `Agora Voice AI connected (${voiceDisplayName})` });
        },
        onUserInterimTranscript: (text) => {
          setTranscript(text);
        },
        onUserFinalTranscript: (text) => {
          setTranscript(text);
          runVoiceCommandRef.current(text, { speak: false });
        },
        onAssistantTranscript: (text) => {
          setAssistantReply(text);
        },
        onSpeakingChange: (speaking) => {
          setVoiceStatus(speaking ? 'speaking' : 'listening');
        },
        onError: (msg) => {
          setAgoraActive(false);
          setAgoraMuted(false);
          setVoiceStatus('error');
          setAssistantReply(msg);
          pushChip({ type: 'error', text: msg });
          window.setTimeout(() => setVoiceStatus('idle'), 1500);
        },
        onDisconnected: () => {
          setAgoraActive(false);
          setAgoraMuted(false);
          setAgoraVoiceName('');
          setVoiceStatus('idle');
        },
      }
    );
  }, [cartCount, lang, pushChip, route, voiceGender]);

  const stopAgoraVoice = useCallback(async () => {
    if (!agoraSessionRef.current) return;
    await agoraSessionRef.current.stop({
      onDisconnected: () => {
        setAgoraActive(false);
        setAgoraMuted(false);
        setAgoraVoiceName('');
        setVoiceStatus('idle');
      },
    });
  }, []);

  const toggleAgoraMute = useCallback(async () => {
    if (!agoraSessionRef.current) return;
    const nextMuted = !agoraMuted;
    await agoraSessionRef.current.setMuted(nextMuted);
    setAgoraMuted(nextMuted);
    pushChip({ type: 'info', text: nextMuted ? 'Microphone muted' : 'Microphone unmuted' });
  }, [agoraMuted, pushChip]);

  useEffect(() => {
    return () => {
      agoraSessionRef.current?.stop();
    };
  }, []);

  const value: VibeCartContextValue = {
    products,
    authUserId,
    authMode,
    authEmail,
    signInWithGoogle,
    signInWithMagicLink,
    signOutSupabase,
    refreshOrders,
    route,
    focusedProductId,
    navigate,
    lang,
    setLang,
    voiceGender,
    setVoiceGender,
    simpleView,
    setSimpleView,
    cart,
    cartCount,
    cartSubtotal,
    shippingFee,
    cartTotal,
    lastAddedPulse,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    lastResults,
    searchCriteria,
    applySearch,
    compareIds,
    toggleCompareId,
    setCompareIds,
    orders,
    createOrder,
    advanceOrderStatus,
    submitReturn,
    addresses,
    saveAddress,
    voiceStatus,
    setVoiceStatus,
    transcript,
    setTranscript,
    assistantReply,
    voiceOverlayOpen,
    setVoiceOverlayOpen,
    agoraActive,
    agoraMuted,
    agoraVoiceName,
    startAgoraVoice,
    stopAgoraVoice,
    toggleAgoraMute,
    chips,
    pushChip,
    dismissChip,
    runVoiceCommand,
  };

  return <VibeCartContext.Provider value={value}>{children}</VibeCartContext.Provider>;
};

export function useVibeCart(): VibeCartContextValue {
  const ctx = useContext(VibeCartContext);
  if (!ctx) throw new Error('useVibeCart must be used within VibeCartProvider');
  return ctx;
}
