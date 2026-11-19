import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Address, Order, OrderEvent, OrderStatus, Product, ProductPreset } from '../types';

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
];

const VALID_CATEGORIES: Product['category'][] = [
  'audio',
  'wearables',
  'smart-home',
  'footwear',
  'peripherals',
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
    brand: String(row.brand ?? 'VibeCart'),
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

export async function ensureSupabaseSession(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.id) {
    return data.session.user.id;
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
