export type LangCode = 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN';

export type RouteName =
  | 'home'
  | 'results'
  | 'product'
  | 'compare'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'profile';

export type ProductPreset =
  | 'earbuds'
  | 'headphones'
  | 'smartwatch'
  | 'speaker'
  | 'sneakers'
  | 'keyboard';

export interface ProductVariant {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  dbUuid?: string;
  title: string;
  brand: string;
  category: 'audio' | 'wearables' | 'smart-home' | 'footwear' | 'peripherals';
  categoryLabel: string;
  description: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  stock: number;
  imageUrl: string;
  modelPreset: ProductPreset;
  dealLabel?: string;
  specs: Record<string, string>;
  variants: ProductVariant[];
  tags: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  variantName: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export type OrderStatus =
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  variantName: string;
  imageUrl: string;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  note: string;
  timestamp: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  itemTitle: string;
  reason: string;
  status: 'requested' | 'approved' | 'refunded';
  createdAt: string;
}

export interface Order {
  id: string;
  dbUuid?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  address: Address;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  events: OrderEvent[];
  returnRequest?: ReturnRequest;
  createdAt: string;
}

export type VoiceGender = 'female' | 'male';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export type PaymentMethod = 'card' | 'upi';

export interface CheckoutDraft {
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export type IntentType =
  | 'SEARCH_PRODUCTS'
  | 'RECOMMEND'
  | 'ASK_PRODUCT'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'UPDATE_QUANTITY'
  | 'CLEAR_CART'
  | 'COMPARE'
  | 'SHOW_CART'
  | 'CHECKOUT'
  | 'FILL_CHECKOUT'
  | 'NAVIGATE'
  | 'SIGN_IN_GOOGLE'
  | 'CONFIRM'
  | 'DENY'
  | 'TRACK_ORDER'
  | 'RETURN_ITEM'
  | 'CHANGE_LANGUAGE'
  | 'HELP'
  | 'UNKNOWN';

export interface ProductRef {
  index?: number;
  id?: string;
  name?: string;
  this?: boolean;
}

export interface ParsedIntent {
  intent: IntentType;
  confidence: number;
  entities: {
    query?: string;
    category?: Product['category'];
    maxPrice?: number;
    minPrice?: number;
    color?: string;
    brand?: string;
    productRef?: ProductRef;
    productRefs?: ProductRef[];
    quantity?: number;
    variant?: string;
    question?: string;
    occasion?: string;
    reason?: string;
    lang?: LangCode;
    targetRoute?: RouteName;
    checkoutFields?: Partial<CheckoutDraft>;
    payMethod?: PaymentMethod;
    upiId?: string;
    useSavedAddress?: boolean;
    submitPayment?: boolean;
  };
  followUpActions?: ParsedIntent[];
}

export interface ActionChip {
  id: string;
  type: 'success' | 'info' | 'error';
  text: string;
  undoLabel?: string;
  onUndo?: () => void;
}
