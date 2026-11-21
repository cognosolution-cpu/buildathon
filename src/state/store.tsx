import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, HOME_FEATURED_IDS, searchCatalog } from '../data/catalog';
import {
  buildProfileFromAuthUser,
  ensureSupabaseSession,
  fetchSupabaseCatalog,
  fetchSupabaseOrders,
  getOrCreateActiveCartId,
  isSupabaseConfigured,
  logUserActivity,
  searchSupabaseProducts,
  supabase,
  syncUserProfile,
  updateUserProfile,
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
  CheckoutDraft,
  LangCode,
  Order,
  OrderStatus,
  ParsedIntent,
  PaymentMethod,
  Product,
  ProductRef,
  RouteName,
  UserProfile,
  VoiceGender,
  VoiceStatus,
} from '../types';

const STORAGE_KEY = 'voicocart_state_v1';
const LEGACY_STORAGE_KEY = 'vibecart_state_v1';

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
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
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
        voiceGender:
          parsed.voiceGender === 'cloned'
            ? 'cloned'
            : parsed.voiceGender === 'male'
              ? 'male'
              : 'female',
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
  profile: UserProfile | null;
  updateProfile: (patch: { fullName: string; phone: string }) => Promise<{ ok: boolean; message: string }>;
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
  saveAddress: (address: Omit<Address, 'id'> & { id?: string }) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  checkoutDraft: CheckoutDraft;
  setCheckoutDraft: React.Dispatch<React.SetStateAction<CheckoutDraft>>;
  payMethod: PaymentMethod;
  setPayMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  upiId: string;
  setUpiId: React.Dispatch<React.SetStateAction<string>>;
  checkoutSubmitNonce: number;
  triggerCheckoutSubmit: () => void;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [route, setRoute] = useState<RouteName>(initialRoute.route);
  const [focusedProductId, setFocusedProductId] = useState<string>(
    initialRoute.productId ?? CATALOG[0].id
  );
  const [lang, setLangState] = useState<LangCode>(initialPersisted.lang);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(initialPersisted.voiceGender);
  const [cart, setCart] = useState<CartItem[]>(initialPersisted.cart);
  const [orders, setOrders] = useState<Order[]>(initialPersisted.orders);
  const [addresses, setAddresses] = useState<Address[]>(initialPersisted.addresses);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft>({
    name: initialPersisted.addresses[0]?.name ?? '',
    phone: initialPersisted.addresses[0]?.phone ?? '',
    line1: initialPersisted.addresses[0]?.line1 ?? '',
    city: initialPersisted.addresses[0]?.city ?? '',
    state: initialPersisted.addresses[0]?.state ?? '',
    pincode: initialPersisted.addresses[0]?.pincode ?? '',
  });
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [upiId, setUpiId] = useState<string>('success@razorpay');
  const [checkoutSubmitNonce, setCheckoutSubmitNonce] = useState<number>(0);
  const [simpleView, setSimpleViewState] = useState<boolean>(initialPersisted.simpleView);
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
  const cartRef = useRef<CartItem[]>(cart);
  cartRef.current = cart;
  const checkoutDraftRef = useRef<CheckoutDraft>(checkoutDraft);
  checkoutDraftRef.current = checkoutDraft;
  const agoraSessionRef = useRef<AgoraVoiceSession | null>(null);
  const lastUserVoiceAtRef = useRef<number>(0);

  const triggerCheckoutSubmit = useCallback(() => {
    setCheckoutSubmitNonce((n) => n + 1);
  }, []);

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

  // Boot Supabase session, catalog hydration, user profile/state, and Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let cancelled = false;
    let activeUserId: string | null = null;

    const hydrateUserAccountData = async (userId: string) => {
      if (!supabase || cancelled) return;

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (cancelled || !user) return;

      setAuthUserId(user.id);
      setAuthEmail(user.email ?? null);
      setAuthMode(user.is_anonymous ? 'anonymous' : 'authenticated');

      if (!user.is_anonymous) {
        const immediate = buildProfileFromAuthUser(user, lang);
        setProfile(immediate);

        const synced = await syncUserProfile(user, lang);
        if (!cancelled) {
          setProfile(synced);
          setCheckoutDraft((prev) => ({
            ...prev,
            name: prev.name || synced.fullName,
            phone: prev.phone || synced.phone,
          }));
        }
      } else {
        setProfile(null);
      }

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
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!cancelled && addrRows && addrRows.length > 0) {
        const mappedAddrs: Address[] = addrRows.map((a) => ({
          id: String(a.id),
          name: String(a.name),
          phone: String(a.phone),
          line1: String(a.line1),
          city: String(a.city),
          state: String(a.state),
          pincode: String(a.pincode),
          isDefault: Boolean(a.is_default),
        }));
        setAddresses(mappedAddrs);
        const preferred = mappedAddrs.find((a) => a.isDefault) ?? mappedAddrs[0];
        if (preferred) {
          setCheckoutDraft((prev) => ({
            name: prev.name || preferred.name,
            phone: prev.phone || preferred.phone,
            line1: prev.line1 || preferred.line1,
            city: prev.city || preferred.city,
            state: prev.state || preferred.state,
            pincode: prev.pincode || preferred.pincode,
          }));
        }
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
      if (cancelled || !userId) return;
      activeUserId = userId;
      await hydrateUserAccountData(userId);
    };

    hydrateFromSupabase();

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user = session.user;
        activeUserId = user.id;
        setAuthUserId(user.id);
        setAuthEmail(user.email ?? null);
        setAuthMode(user.is_anonymous ? 'anonymous' : 'authenticated');

        if (!user.is_anonymous) {
          const immediate = buildProfileFromAuthUser(user, lang);
          setProfile(immediate);
          syncUserProfile(user, lang).then((synced) => {
            if (!cancelled) {
              setProfile(synced);
              setCheckoutDraft((prev) => ({
                ...prev,
                name: prev.name || synced.fullName,
                phone: prev.phone || synced.phone,
              }));
            }
          });

          if (event === 'SIGNED_IN') {
            logUserActivity(user.id, 'sign_in', {
              email: user.email ?? '',
              provider: String(user.app_metadata?.provider ?? 'oauth'),
            });
            hydrateUserAccountData(user.id);
          }

          try {
            const postAuth = sessionStorage.getItem('vc_post_auth_route');
            const hasOAuthHash =
              window.location.hash.includes('access_token=') ||
              window.location.hash.includes('refresh_token=');
            if (postAuth === 'profile' || hasOAuthHash) {
              sessionStorage.removeItem('vc_post_auth_route');
              setRoute('profile');
              window.location.hash = '#/profile';
            }
          } catch {
            // Ignore storage errors
          }
        }
      } else {
        activeUserId = null;
        setAuthUserId(null);
        setAuthEmail(null);
        setAuthMode('sandbox');
        setProfile(null);
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
          if (activeUserId) {
            fetchSupabaseOrders(activeUserId).then((next) => {
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
  }, [pushChip]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const setSimpleView = useCallback(
    (simple: boolean) => {
      setSimpleViewState(simple);
      pushChip({
        type: 'info',
        text: simple ? 'Simple View ON · 2D Studio Photos' : '3D Interactive View ON',
      });
    },
    [pushChip]
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

      const computeNext = (prev: CartItem[]): CartItem[] => {
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
      };

      const updatedSync = computeNext(cartRef.current);
      cartRef.current = updatedSync;
      setCart(updatedSync);

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
              const filtered = prev.filter((_, i) => i !== idx);
              cartRef.current = filtered;
              return filtered;
            }
            const reduced = prev[idx].quantity - quantity;
            syncCartItemToSupabase(productId, chosenVariant, reduced);
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: reduced };
            cartRef.current = next;
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
        const filtered = cartRef.current.filter(
          (i) => !(i.productId === productId && i.variantName === variantName)
        );
        cartRef.current = filtered;
        setCart(filtered);
        syncCartItemToSupabase(productId, variantName, 0);
        return;
      }
      const clamped = Math.min(10, quantity);
      const next = cartRef.current.map((i) =>
        i.productId === productId && i.variantName === variantName
          ? { ...i, quantity: clamped }
          : i
      );
      cartRef.current = next;
      setCart(next);
      syncCartItemToSupabase(productId, variantName, clamped);
    },
    [syncCartItemToSupabase]
  );

  const clearCart = useCallback(() => {
    cartRef.current = [];
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
    async (input: Omit<Address, 'id'> & { id?: string }): Promise<Address> => {
      const tempId = input.id && input.id.trim() ? input.id : `addr-${Date.now()}`;
      const makeDefault = input.isDefault ?? addresses.length === 0;
      const normalizedLine = input.line1.trim().toLowerCase();
      const normalizedPin = input.pincode.trim();

      const nextAddress: Address = {
        id: tempId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        line1: input.line1.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        pincode: normalizedPin,
        isDefault: makeDefault,
      };

      setAddresses((prev) => {
        const cleaned = prev
          .filter(
            (a) =>
              a.id !== nextAddress.id &&
              !(
                a.line1.trim().toLowerCase() === normalizedLine &&
                a.pincode.trim() === normalizedPin
              )
          )
          .map((a) => (makeDefault ? { ...a, isDefault: false } : a));
        return makeDefault ? [nextAddress, ...cleaned] : [...cleaned, nextAddress];
      });

      if (makeDefault) {
        setCheckoutDraft((prev) => ({
          name: nextAddress.name || prev.name,
          phone: nextAddress.phone || prev.phone,
          line1: nextAddress.line1 || prev.line1,
          city: nextAddress.city || prev.city,
          state: nextAddress.state || prev.state,
          pincode: nextAddress.pincode || prev.pincode,
        }));
      }

      if (isSupabaseConfigured && supabase && authUserId) {
        try {
          if (makeDefault) {
            await supabase
              .from('addresses')
              .update({ is_default: false })
              .eq('user_id', authUserId);
          }

          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            tempId
          );

          const payload = {
            user_id: authUserId,
            name: nextAddress.name,
            phone: nextAddress.phone,
            line1: nextAddress.line1,
            city: nextAddress.city,
            state: nextAddress.state,
            pincode: nextAddress.pincode,
            is_default: makeDefault,
          };

          const { data: savedRow } = isUuid
            ? await supabase
                .from('addresses')
                .update(payload)
                .eq('id', tempId)
                .eq('user_id', authUserId)
                .select('id')
                .maybeSingle()
            : await supabase
                .from('addresses')
                .insert(payload)
                .select('id')
                .maybeSingle();

          if (savedRow?.id) {
            const dbId = String(savedRow.id);
            nextAddress.id = dbId;
            setAddresses((prev) => prev.map((a) => (a.id === tempId ? { ...a, id: dbId } : a)));
          }
          await logUserActivity(authUserId, 'address_saved', {
            city: nextAddress.city,
            pincode: nextAddress.pincode,
          });
        } catch {
          // Local storage still preserves the address even if offline
        }
      }

      pushChip({ type: 'success', text: `Saved delivery address (${nextAddress.city})` });
      return nextAddress;
    },
    [addresses.length, authUserId, pushChip]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        return remaining;
      });
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid && isSupabaseConfigured && supabase && authUserId) {
        await supabase.from('addresses').delete().eq('id', id).eq('user_id', authUserId);
      }
      pushChip({ type: 'info', text: 'Address removed' });
    },
    [authUserId, pushChip]
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      let chosen: Address | undefined;
      setAddresses((prev) => {
        chosen = prev.find((a) => a.id === id);
        return prev
          .map((a) => ({ ...a, isDefault: a.id === id }))
          .sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)));
      });
      if (chosen) {
        setCheckoutDraft({
          name: chosen.name,
          phone: chosen.phone,
          line1: chosen.line1,
          city: chosen.city,
          state: chosen.state,
          pincode: chosen.pincode,
        });
      }
      if (isSupabaseConfigured && supabase && authUserId) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', authUserId);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('id', id)
            .eq('user_id', authUserId);
        }
      }
      pushChip({ type: 'success', text: 'Default delivery address updated' });
    },
    [authUserId, pushChip]
  );

  const updateProfile = useCallback(
    async (patch: { fullName: string; phone: string }): Promise<{ ok: boolean; message: string }> => {
      const cleanName = patch.fullName.trim();
      const cleanPhone = patch.phone.trim();
      if (cleanName.length < 2) {
        return { ok: false, message: 'Enter your full name (at least 2 characters).' };
      }

      setProfile((prev) =>
        prev
          ? { ...prev, fullName: cleanName, phone: cleanPhone }
          : authUserId
            ? {
                id: authUserId,
                email: authEmail ?? '',
                fullName: cleanName,
                phone: cleanPhone,
                preferredLang: lang,
              }
            : null
      );
      setCheckoutDraft((prev) => ({
        ...prev,
        name: cleanName || prev.name,
        phone: cleanPhone || prev.phone,
      }));

      if (isSupabaseConfigured && supabase && authUserId) {
        const res = await updateUserProfile(authUserId, {
          fullName: cleanName,
          phone: cleanPhone,
          email: authEmail ?? undefined,
          avatarUrl: profile?.avatarUrl,
          preferredLang: lang,
        });
        if (!res.ok) {
          return { ok: false, message: res.error ?? 'Could not save profile to database.' };
        }
        await logUserActivity(authUserId, 'profile_updated', { fullName: cleanName });
      }

      pushChip({ type: 'success', text: 'Personal information saved' });
      return { ok: true, message: 'Personal information saved.' };
    },
    [authEmail, authUserId, lang, profile?.avatarUrl, pushChip]
  );

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: 'Configure Supabase env vars to enable Google Sign-In.' };
    }
    try {
      sessionStorage.setItem('vc_post_auth_route', 'profile');
    } catch {
      // Ignore storage errors
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
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
      try {
        sessionStorage.setItem('vc_post_auth_route', 'profile');
      } catch {
        // Ignore storage errors
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
    if (authUserId) {
      await logUserActivity(authUserId, 'sign_out');
    }
    await supabase.auth.signOut();
    setProfile(null);
    setAuthUserId(null);
    setAuthEmail(null);
    setAuthMode('sandbox');
    pushChip({ type: 'info', text: 'Signed out successfully.' });
  }, [authUserId, pushChip]);

  const resolveRef = useCallback(
    (ref?: ProductRef): Product | null => {
      if (!ref) return null;
      const all = productsRef.current;
      const visiblePool =
        route === 'home'
          ? HOME_FEATURED_IDS.map((id) => all.find((p) => p.id === id)).filter(
              (p): p is Product => Boolean(p)
            )
          : lastResults;
      if (ref.index) return visiblePool[ref.index - 1] ?? lastResults[ref.index - 1] ?? all[ref.index - 1] ?? null;
      if (ref.id) return all.find((p) => p.id === ref.id) ?? null;
      if (ref.this) return all.find((p) => p.id === focusedProductId) ?? visiblePool[0] ?? lastResults[0] ?? null;
      if (ref.name) {
        const lower = ref.name
          .toLowerCase()
          .replace(/[.,!?।]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!lower) return null;
        const direct =
          lastResults.find((p) => p.title.toLowerCase().includes(lower)) ??
          all.find(
            (p) =>
              p.title.toLowerCase().includes(lower) ||
              p.tags.some((tag) => lower.includes(tag.toLowerCase()))
          );
        if (direct) return direct;

        // Token-based fuzzy match (handles "pulse buds air", "chronopulse", etc.)
        const tokens = lower.split(' ').filter((tok) => tok.length >= 2);
        if (tokens.length > 0) {
          let bestProduct: Product | null = null;
          let bestScore = 0;
          for (const candidate of [...lastResults, ...all]) {
            const hay = `${candidate.title} ${candidate.brand} ${candidate.tags.join(' ')}`.toLowerCase();
            const score = tokens.reduce((acc, tok) => acc + (hay.includes(tok) ? 1 : 0), 0);
            if (score > bestScore) {
              bestScore = score;
              bestProduct = candidate;
            }
          }
          if (bestProduct && bestScore >= 1) return bestProduct;
        }
      }
      return null;
    },
    [focusedProductId, lastResults, route]
  );

  const executeParsedAction = useCallback(
    (action: ParsedIntent, replyHint?: string): string => {
      const all = productsRef.current;
      const liveCart = cartRef.current;
      const liveCartCount = liveCart.reduce((s, i) => s + i.quantity, 0);
      const liveSubtotal = liveCart.reduce((s, i) => {
        const prod = all.find((p) => p.id === i.productId);
        return s + (prod ? prod.price * i.quantity : 0);
      }, 0);
      const liveShipping = liveSubtotal === 0 || liveSubtotal > 999 ? 0 : 49;
      const liveCartTotal = liveSubtotal + liveShipping;

      switch (action.intent) {
        case 'CHANGE_LANGUAGE': {
          const nextLang = action.entities.lang ?? 'en-IN';
          setLang(nextLang);
          const langLabel = LANGUAGES.find((l) => l.code === nextLang)?.nativeLabel ?? nextLang;
          const reply = t(nextLang, 'languageChangedReply', { lang: langLabel });
          pushChip({ type: 'info', text: reply });
          return reply;
        }

        case 'NAVIGATE': {
          const dest = action.entities.targetRoute ?? 'home';
          navigate(dest);
          return `Opened ${dest === 'results' ? 'Explore' : dest} page.`;
        }

        case 'SIGN_IN_GOOGLE': {
          navigate('profile');
          signInWithGoogle().then((res) => {
            if (!res.ok) pushChip({ type: 'error', text: res.message });
          });
          return 'Opening Google Sign-In.';
        }

        case 'SEARCH_PRODUCTS':
        case 'RECOMMEND': {
          const query = action.entities.query ?? (action.intent === 'RECOMMEND' ? 'gift' : '');
          const category = action.entities.category ?? 'all';
          const maxPrice = action.entities.maxPrice ?? null;
          setSearchCriteria({ query, category, maxPrice });
          const matched = searchCatalog(
            {
              query,
              category,
              maxPrice: maxPrice ?? undefined,
            },
            all
          );
          let reply: string;
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
          return reply;
        }

        case 'ASK_PRODUCT': {
          const target = resolveRef(action.entities.productRef) ?? lastResults[0] ?? all[0];
          if (action.entities.simpleView === false) {
            setSimpleView(false);
            pushChip({ type: 'success', text: `3D View · ${target.title}` });
          } else if (action.entities.simpleView === true) {
            setSimpleView(true);
          }
          navigate('product', target.id);
          const q = (action.entities.question ?? '').toLowerCase();
          if (action.entities.simpleView === false || /\b3d\b/i.test(q)) {
            return replyHint ?? `Opening ${target.title} in interactive 3D view.`;
          }
          if (q.includes('water')) {
            return `${target.title} features ${target.specs['Water Resistance'] ?? 'splash protection'}.`;
          }
          if (q.includes('battery')) {
            return `${target.title} delivers ${target.specs.Battery ?? 'all-day battery life'}.`;
          }
          if (q.includes('warranty')) {
            return `${target.title} includes a ${target.specs.Warranty ?? '1 Year'} manufacturer warranty.`;
          }
          return (
            replyHint ??
            `${target.title} by ${target.brand} is ₹${target.price.toLocaleString('en-IN')} with a ${target.rating} star rating.`
          );
        }

        case 'ADD_TO_CART': {
          const target = resolveRef(action.entities.productRef);
          if (!target) {
            pushChip({ type: 'error', text: 'Specify product name or number (1–' + lastResults.length + ')' });
            return 'Which product would you like? Say its name or a number from 1 to ' + lastResults.length + '.';
          }
          const colorHint = action.entities.variant?.toLowerCase();
          const matchedVariant = colorHint
            ? target.variants.find((v) => v.name.toLowerCase().includes(colorHint))?.name
            : target.variants[0]?.name;
          addToCart(target.id, action.entities.quantity ?? 1, matchedVariant);
          return replyHint ?? t(lang, 'addedReply', { title: target.title });
        }

        case 'REMOVE_FROM_CART': {
          const inCartProducts = liveCart
            .map((c) => all.find((p) => p.id === c.productId))
            .filter((p): p is Product => Boolean(p));
          const ref = action.entities.productRef;
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
            return t(lang, 'removedReply', { title: target.title });
          }
          return 'I could not find that item in your cart.';
        }

        case 'UPDATE_QUANTITY': {
          const firstItem = liveCart[0];
          if (firstItem) {
            const qty = action.entities.quantity ?? 1;
            updateQuantity(firstItem.productId, firstItem.variantName, qty);
            const prod = all.find((p) => p.id === firstItem.productId);
            const reply = `Updated ${prod?.title ?? 'item'} quantity to ${qty}.`;
            pushChip({ type: 'info', text: reply });
            return reply;
          }
          return t(lang, 'emptyCart');
        }

        case 'CLEAR_CART': {
          clearCart();
          pushChip({ type: 'info', text: 'Cart cleared' });
          return 'Cleared all items from your cart.';
        }

        case 'COMPARE': {
          const refs = action.entities.productRefs ?? [];
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
          navigate('compare');
          return comparison?.verdict ?? 'Opening comparison view.';
        }

        case 'SHOW_CART': {
          navigate('cart');
          return liveCartCount > 0
            ? t(lang, 'cartSummaryReply', {
                count: liveCartCount,
                total: liveCartTotal.toLocaleString('en-IN'),
              })
            : t(lang, 'emptyCart');
        }

        case 'CHECKOUT': {
          if (liveCartCount === 0) {
            const reply = t(lang, 'emptyCart');
            pushChip({ type: 'error', text: reply });
            return reply;
          }
          setPendingConfirmation({ type: 'CHECKOUT' });
          navigate('checkout');
          return t(lang, 'checkoutPromptReply', {
            total: liveCartTotal.toLocaleString('en-IN'),
          });
        }

        case 'FILL_CHECKOUT': {
          if (liveCartCount > 0 && route !== 'checkout') {
            navigate('checkout');
          }
          let mergedDraft = { ...checkoutDraftRef.current };
          if (action.entities.useSavedAddress && addresses[0]) {
            mergedDraft = {
              name: addresses[0].name,
              phone: addresses[0].phone,
              line1: addresses[0].line1,
              city: addresses[0].city,
              state: addresses[0].state,
              pincode: addresses[0].pincode,
            };
          }
          if (action.entities.checkoutFields) {
            mergedDraft = { ...mergedDraft, ...action.entities.checkoutFields };
          }
          checkoutDraftRef.current = mergedDraft;
          setCheckoutDraft(mergedDraft);

          if (action.entities.saveAddress && mergedDraft.line1 && mergedDraft.city) {
            saveAddress({
              name: mergedDraft.name || profile?.fullName || 'VoicoCart Shopper',
              phone: mergedDraft.phone || profile?.phone || '9876543210',
              line1: mergedDraft.line1,
              city: mergedDraft.city,
              state: mergedDraft.state || 'India',
              pincode: mergedDraft.pincode || '560001',
              isDefault: true,
            });
          }

          if (action.entities.payMethod) {
            setPayMethod(action.entities.payMethod);
          }
          if (action.entities.upiId) {
            setPayMethod('upi');
            setUpiId(action.entities.upiId);
          }
          if (action.entities.submitPayment) {
            if (liveCartCount === 0) {
              return t(lang, 'emptyCart');
            }
            navigate('checkout');
            triggerCheckoutSubmit();
            return 'Submitting checkout details and opening payment.';
          }

          const updatedParts: string[] = [];
          if (action.entities.checkoutFields?.name) updatedParts.push('name');
          if (action.entities.checkoutFields?.phone) updatedParts.push('phone');
          if (action.entities.checkoutFields?.line1) updatedParts.push('address');
          if (action.entities.checkoutFields?.city) updatedParts.push('city');
          if (action.entities.checkoutFields?.state) updatedParts.push('state');
          if (action.entities.checkoutFields?.pincode) updatedParts.push('PIN code');
          if (action.entities.saveAddress) updatedParts.push('saved to profile');
          if (action.entities.payMethod) updatedParts.push(`${action.entities.payMethod.toUpperCase()} payment`);
          if (action.entities.useSavedAddress) updatedParts.push('saved address');

          const summary = updatedParts.length > 0 ? updatedParts.join(', ') : 'checkout details';
          pushChip({ type: 'success', text: `Updated ${summary}` });
          return `Updated ${summary} on checkout.`;
        }

        case 'SAVE_ADDRESS': {
          const merged = {
            name:
              action.entities.checkoutFields?.name ||
              checkoutDraftRef.current.name ||
              profile?.fullName ||
              '',
            phone:
              action.entities.checkoutFields?.phone ||
              checkoutDraftRef.current.phone ||
              profile?.phone ||
              '',
            line1:
              action.entities.checkoutFields?.line1 ||
              checkoutDraftRef.current.line1 ||
              '',
            city:
              action.entities.checkoutFields?.city ||
              checkoutDraftRef.current.city ||
              '',
            state:
              action.entities.checkoutFields?.state ||
              checkoutDraftRef.current.state ||
              '',
            pincode:
              action.entities.checkoutFields?.pincode ||
              checkoutDraftRef.current.pincode ||
              '',
          };

          checkoutDraftRef.current = merged;
          setCheckoutDraft(merged);

          if (!merged.line1 || !merged.city || !merged.pincode) {
            navigate('profile');
            pushChip({ type: 'info', text: 'Tell me street, city & PIN code to save address' });
            return 'Please include street address, city, and 6-digit PIN code so I can save your address.';
          }

          saveAddress({
            name: merged.name || 'VoicoCart Shopper',
            phone: merged.phone || '9876543210',
            line1: merged.line1,
            city: merged.city,
            state: merged.state || 'India',
            pincode: merged.pincode,
            isDefault: true,
          });
          if (route !== 'checkout') {
            navigate('profile');
          }
          return `Saved delivery address in ${merged.city} (${merged.pincode}) to your profile.`;
        }

        case 'UPDATE_PROFILE': {
          const nextName =
            action.entities.profileFields?.fullName ||
            profile?.fullName ||
            checkoutDraftRef.current.name ||
            '';
          const nextPhone =
            action.entities.profileFields?.phone ||
            profile?.phone ||
            checkoutDraftRef.current.phone ||
            '';

          if (!nextName && !nextPhone) {
            navigate('profile');
            return 'Tell me your full name or 10-digit mobile number to update your profile.';
          }

          setCheckoutDraft((prev) => ({
            ...prev,
            name: nextName || prev.name,
            phone: nextPhone || prev.phone,
          }));

          if (nextName.length >= 2) {
            updateProfile({ fullName: nextName, phone: nextPhone });
          } else {
            pushChip({ type: 'success', text: `Updated phone ${nextPhone}` });
          }
          navigate('profile');
          return `Saved your personal details${nextName ? ` for ${nextName}` : ''}.`;
        }

        case 'TOGGLE_SIMPLE_VIEW': {
          const nextSimple =
            typeof action.entities.simpleView === 'boolean'
              ? action.entities.simpleView
              : !simpleView;
          setSimpleView(nextSimple);
          if (action.entities.productRef) {
            const target = resolveRef(action.entities.productRef);
            if (target) {
              navigate('product', target.id);
              return nextSimple
                ? `Opening ${target.title} in Simple View (2D photos).`
                : `Opening ${target.title} in interactive 3D view.`;
            }
          }
          return nextSimple
            ? 'Switched to Simple View with 2D studio product photos.'
            : 'Switched back to interactive 3D product view.';
        }

        case 'CONFIRM': {
          if (pendingConfirmation?.type === 'CHECKOUT' || route === 'checkout') {
            setPendingConfirmation(null);
            navigate('checkout');
            triggerCheckoutSubmit();
            return 'Proceeding with checkout payment.';
          }
          return 'Confirmed.';
        }

        case 'DENY': {
          if (pendingConfirmation) {
            setPendingConfirmation(null);
            return 'Cancelled that action. How else can I help?';
          }
          return 'Okay, cancelled.';
        }

        case 'TRACK_ORDER': {
          navigate('orders');
          const latest = orders[0];
          return latest
            ? t(lang, 'orderStatusReply', { status: latest.status.replace(/_/g, ' ') })
            : 'You have no active orders yet.';
        }

        case 'RETURN_ITEM': {
          const latest = orders[0];
          if (!latest || latest.items.length === 0) {
            return 'No recent order found to return.';
          }
          const item = latest.items[0];
          const reason = action.entities.reason || 'Customer requested return';
          submitReturn(latest.id, item.title, reason);
          navigate('orders');
          return t(lang, 'returnConfirmedReply', { title: item.title });
        }

        case 'HELP': {
          return 'Try saying: Add PulseBuds Air ANC and go to checkout, Save my delivery address, Update my profile phone, or Turn on simple view.';
        }

        default: {
          pushChip({ type: 'error', text: 'Try: "Add PulseBuds Air ANC and checkout"' });
          return replyHint ?? t(lang, 'notUnderstoodReply');
        }
      }
    },
    [
      addToCart,
      addresses,
      clearCart,
      lang,
      lastResults,
      navigate,
      orders,
      pendingConfirmation,
      profile?.fullName,
      profile?.phone,
      pushChip,
      removeFromCart,
      resolveRef,
      route,
      saveAddress,
      setLang,
      setSimpleView,
      signInWithGoogle,
      simpleView,
      submitReturn,
      triggerCheckoutSubmit,
      updateProfile,
      updateQuantity,
    ]
  );

  const runVoiceCommand = useCallback(
    async (text: string, options: { speak?: boolean } = { speak: true }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      lastUserVoiceAtRef.current = Date.now();
      setTranscript(trimmed);
      setVoiceStatus('thinking');

      const { parsed, replyHint } = await understand(trimmed, {
        screen: route,
        lang,
        cartCount: cartRef.current.reduce((s, i) => s + i.quantity, 0),
        visibleProducts: lastResults.slice(0, 6).map((p, idx) => ({
          index: idx + 1,
          id: p.id,
          title: p.title,
          price: p.price,
        })),
      });

      const replies: string[] = [];
      replies.push(executeParsedAction(parsed, parsed.followUpActions?.length ? undefined : replyHint));
      if (parsed.followUpActions && parsed.followUpActions.length > 0) {
        for (const nextAction of parsed.followUpActions) {
          replies.push(executeParsedAction(nextAction));
        }
      }

      const combinedReply = replies.filter(Boolean).join(' ');
      setAssistantReply(combinedReply);
      setVoiceStatus(agoraActive ? 'listening' : 'speaking');
      if (options.speak !== false && !agoraActive) {
        speakReply(combinedReply, lang, voiceGender);
      }
      window.setTimeout(() => {
        setVoiceStatus((cur) => (cur === 'speaking' ? 'idle' : cur));
      }, 900);
    },
    [agoraActive, executeParsedAction, lang, lastResults, route, voiceGender]
  );

  const runVoiceCommandRef = useRef(runVoiceCommand);
  runVoiceCommandRef.current = runVoiceCommand;
  const executeParsedActionRef = useRef(executeParsedAction);
  executeParsedActionRef.current = executeParsedAction;

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
        onAssistantTranscript: (text, isFinal) => {
          setAssistantReply(text);
          // Safety net: if Agora's assistant announces adding a product or going to checkout
          // and no user transcript triggered within the last 2.5s, sync the UI automatically.
          if (isFinal && Date.now() - lastUserVoiceAtRef.current > 2500) {
            const lower = text.toLowerCase();
            if (/\badded\b/.test(lower)) {
              const mentioned = productsRef.current.find((p) =>
                lower.includes(p.title.toLowerCase())
              );
              if (mentioned) {
                executeParsedActionRef.current({
                  intent: 'ADD_TO_CART',
                  confidence: 0.9,
                  entities: { productRef: { id: mentioned.id } },
                });
              }
            }
            if (/\bcheckout\b/.test(lower) && cartRef.current.length > 0) {
              navigate('checkout');
            }
          }
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
  }, [cartCount, lang, navigate, pushChip, route, voiceGender]);

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
    profile,
    updateProfile,
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
    deleteAddress,
    setDefaultAddress,
    checkoutDraft,
    setCheckoutDraft,
    payMethod,
    setPayMethod,
    upiId,
    setUpiId,
    checkoutSubmitNonce,
    triggerCheckoutSubmit,
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
