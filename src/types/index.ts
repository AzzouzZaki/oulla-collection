export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  is_primary: boolean;
  order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  color: string;
  size: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  stock: number;
  is_available: boolean;
  colors?: string[];
  sizes?: string[];
  fabric?: string | null;
  created_at: string;
  images?: ProductImage[];
  category?: Category;
  variants?: ProductVariant[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  variant_id?: number | null;
  quantity: number;
  unit_price: number;
  color?: string; // from join
  size?: string;  // from join
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_instagram: string | null;
  customer_address: string;
  wilaya: string;
  total_price: number;
  status: OrderStatus;
  zvit_tracking_id: string | null;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}
