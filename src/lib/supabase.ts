import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type {
  Address,
  LangCode,
  Order,
  OrderEvent,
  OrderStatus,
  Product,
  ProductPreset,
  UserProfile,
} from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  /^https?:\/\//i.test(supabaseUrl);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const VALID_PRESETS: ProductPreset[] = [
  'earbuds',
  'headphones',
  'smartwatch',
  'speaker',
  'sneakers',
  'keyboard',
  'camera',
  'glasses',
  'powerbank',
  'lamp',
  'backpack',
  'mouse',
  'controller',
  'dock',
  'recovery',
  'charger',
];

const VALID_CATEGORIES: Product['category'][] = [
  'audio',
  'wearables',
  'smart-home',
  'footwear',
  'peripherals',
  'cameras',
  'eyewear',
  'accessories',
  'gaming',
  'workspace',
  'fitness',
  'travel',
];

// Map Postgres product row into frontend Product shape
export function mapProductRow(row: Record<string, unknown>): Product {
  const catSlug = String(row.category_slug ?? 'audio') as Product['category'];
  const category = VALID_CATEGORIES.includes(catSlug) ? catSlug : 'audio';
  const rawPreset = String(row.model_preset ?? 'earbuds') as ProductPreset;
  const modelPreset = VALID_PRESETS.includes(rawPreset) ? rawPreset : 'earbuds';

  return {
    id: String(row.slug ?? row.id),
    dbUuid: typeof row.id === 'string' ? row.id : undefined,
    title: String(row.title ?? 'Product'),
    brand: String(row.brand ?? 'VoicoCart'),
    category,
    categoryLabel: String(row.category_name ?? category),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    mrp: Number(row.mrp ?? row.price ?? 0),
    rating: Number(row.rating ?? 4.5),
    ratingCount: Number(row.rating_count ?? 0),
    stock: Number(row.stock ?? 0),
    imageUrl: String(row.image_url ?? '/src/assets/images/product_earbuds_obsidian_1795037379103.jpg'),
    modelPreset,
    dealLabel: row.deal_label ? String(row.deal_label) : undefined,
    specs:
      row.specs && typeof row.specs === 'object' && !Array.isArray(row.specs)
        ? (row.specs as Record<string, string>)
        : {},
    variants: Array.isArray(row.variants)
      ? (row.variants as Array<{ name: string; hex: string }>)
      : [{ name: 'Obsidian', hex: '#1e1b18' }],
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  };
}

export async function ensureSupabaseSession(options?: {
  allowAnonymous?: boolean;
}): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.id) {
    return data.session.user.id;
  }
  if (!options?.allowAnonymous) {
    return null;
  }
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('vc_anon_disabled') === '1') {
      return null;
    }
  } catch {
    // Ignore storage errors
  }
  const { data: anonData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    try {
      if (
        typeof sessionStorage !== 'undefined' &&
        error.message.toLowerCase().includes('disabled')
      ) {
        sessionStorage.setItem('vc_anon_disabled', '1');
      }
    } catch {
      // Ignore storage errors
    }
    console.warn('[Supabase] Anonymous sign-in skipped:', error.message);
    return null;
  }
  return anonData.user?.id ?? null;
}

export async function fetchSupabaseCatalog(): Promise<Product[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .order('rating', { ascending: false });
  if (error || !data || data.length === 0) return null;

  return data.map((row) => {
    const cat = row.categories as { slug?: string; name?: string } | null;
    return mapProductRow({
      ...row,
      category_slug: cat?.slug ?? 'audio',
      category_name: cat?.name ?? 'Audio',
    });
  });
}

export async function searchSupabaseProducts(params: {
  query?: string;
  category?: Product['category'] | 'all';
  maxPrice?: number | null;
}): Promise<Product[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('search_products', {
    q: params.query?.trim() || null,
    max_price: params.maxPrice ?? null,
    min_price: null,
    cat: params.category && params.category !== 'all' ? params.category : null,
    lim: 24,
  });
  if (error || !Array.isArray(data)) return null;
  return data.map((row) => mapProductRow(row as Record<string, unknown>));
}

export async function getOrCreateActiveCartId(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single();

  if (error) return null;
  return created?.id ?? null;
}

export async function fetchSupabaseOrders(userId: string): Promise<Order[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_events(*), returns(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return null;

  return data.map((row) => {
    const rawEvents = Array.isArray(row.order_events) ? row.order_events : [];
    const sortedEvents: OrderEvent[] = [...rawEvents]
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((ev) => ({
        id: String(ev.id),
        status: ev.status as OrderStatus,
        note: String(ev.note ?? ''),
        timestamp: String(ev.created_at),
      }));

    const rawItems = Array.isArray(row.order_items) ? row.order_items : [];
    const rawReturns = Array.isArray(row.returns) ? row.returns : [];
    const firstReturn = rawReturns[0];

    return {
      id: String(row.order_code ?? row.id),
      dbUuid: String(row.id),
      razorpayOrderId: String(row.razorpay_order_id ?? ''),
      razorpayPaymentId: String(row.razorpay_payment_id ?? ''),
      address: row.address as Address,
      items: rawItems.map((item: Record<string, unknown>) => ({
        productId: String(item.product_slug ?? item.product_id ?? ''),
        title: String(item.title),
        price: Number(item.price),
        quantity: Number(item.quantity),
        variantName: String(item.variant_name ?? 'Standard'),
        imageUrl: String(item.image_url ?? '/src/assets/images/product_earbuds_obsidian_1795037379103.jpg'),
      })),
      subtotal: Number(row.subtotal),
      shipping: Number(row.shipping),
      total: Number(row.total),
      status: (row.status === 'created' ? 'paid' : row.status) as OrderStatus,
      events: sortedEvents,
      returnRequest: firstReturn
        ? {
            id: String(firstReturn.id),
            orderId: String(row.order_code ?? row.id),
            itemTitle: String(firstReturn.item_title),
            reason: String(firstReturn.reason),
            status: firstReturn.status,
            createdAt: String(firstReturn.created_at),
          }
        : undefined,
      createdAt: String(row.created_at),
    };
  });
}

export function buildProfileFromAuthUser(
  user: User,
  fallbackLang: LangCode = 'en-IN'
): UserProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? (typeof meta.email === 'string' ? meta.email : '') ?? '';
  const metaName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (email ? email.split('@')[0] : '');
  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    undefined;

  return {
    id: user.id,
    email,
    fullName: metaName,
    phone: user.phone ?? '',
    avatarUrl,
    preferredLang: fallbackLang,
  };
}

export async function syncUserProfile(
  user: User,
  fallbackLang: LangCode = 'en-IN'
): Promise<UserProfile> {
  const baseProfile = buildProfileFromAuthUser(user, fallbackLang);
  if (!supabase || user.is_anonymous) return baseProfile;

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      const merged: UserProfile = {
        id: user.id,
        email: (typeof existing.email === 'string' && existing.email) || baseProfile.email,
        fullName:
          (typeof existing.full_name === 'string' && existing.full_name.trim()) ||
          baseProfile.fullName,
        phone: (typeof existing.phone === 'string' && existing.phone.trim()) || baseProfile.phone,
        avatarUrl:
          (typeof existing.avatar_url === 'string' && existing.avatar_url.trim()) ||
          baseProfile.avatarUrl,
        preferredLang:
          (typeof existing.preferred_lang === 'string' && existing.preferred_lang)
            ? (existing.preferred_lang as LangCode)
            : fallbackLang,
      };
      return merged;
    }

    // Create initial profile row if missing
    const { error: extErr } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: baseProfile.fullName || null,
      phone: baseProfile.phone || null,
      preferred_lang: baseProfile.preferredLang,
      email: baseProfile.email || null,
      avatar_url: baseProfile.avatarUrl || null,
    });
    if (extErr) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: baseProfile.fullName || null,
        phone: baseProfile.phone || null,
        preferred_lang: baseProfile.preferredLang,
      });
    }
  } catch {
    // Keep metadata-derived profile even if table columns aren't migrated yet
  }

  return baseProfile;
}

export async function updateUserProfile(
  userId: string,
  patch: {
    fullName?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
    preferredLang?: LangCode;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' };

  const basePayload: Record<string, unknown> = { id: userId };
  if (patch.fullName !== undefined) basePayload.full_name = patch.fullName.trim();
  if (patch.phone !== undefined) basePayload.phone = patch.phone.trim();
  if (patch.preferredLang !== undefined) basePayload.preferred_lang = patch.preferredLang;

  const extendedPayload: Record<string, unknown> = {
    ...basePayload,
    ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
    ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl.trim() } : {}),
  };

  const { error } = await supabase.from('profiles').upsert(extendedPayload);
  if (!error) return { ok: true };

  // Fallback for projects that haven't run 002_profile_logs_and_new_products.sql yet
  const { error: fallbackErr } = await supabase.from('profiles').upsert(basePayload);
  if (fallbackErr) return { ok: false, error: fallbackErr.message };
  return { ok: true };
}

export async function logUserActivity(
  userId: string | null,
  eventType: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('user_activity_logs').insert({
      user_id: userId,
      event_type: eventType,
      details,
    });
  } catch {
    // Gracefully skip if logs table is not yet created
  }
}
