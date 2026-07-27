export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  image: string;
  qty: number;
  variant?: string;
}

const CART_KEY = 'oulla_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read cart', e);
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  } catch (e) {
    console.error('Failed to save cart', e);
  }
}

export function addToCart(item: Omit<CartItem, 'qty'> & { qty?: number }) {
  const cart = getCart();
  const quantityToAdd = item.qty ?? 1;
  const existingIdx = cart.findIndex((i) => i.product_id === item.product_id);

  if (existingIdx >= 0) {
    cart[existingIdx].qty += quantityToAdd;
  } else {
    cart.push({ ...item, qty: quantityToAdd });
  }

  saveCart(cart);
}

export function updateCartQty(product_id: number, qty: number) {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.product_id === product_id);
  if (idx >= 0) {
    if (qty <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].qty = qty;
    }
    saveCart(cart);
  }
}

export function removeFromCart(product_id: number) {
  const cart = getCart();
  const updated = cart.filter((i) => i.product_id !== product_id);
  saveCart(updated);
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cart-updated'));
}
