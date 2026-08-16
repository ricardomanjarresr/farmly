export type CartLine = {
  listingId: string;
  item: string;
  unit: string;
  price: number;
  qty: number;
  photoUrl: string | null;
};

export type Cart = {
  farmId: string;
  farmName: string;
  lines: CartLine[];
};

const STORAGE_KEY = "farmly_cart";

export function loadCart(): Cart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart) : null;
  } catch {
    return null;
  }
}

export function saveCart(cart: Cart | null) {
  if (typeof window === "undefined") return;
  if (!cart || cart.lines.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }
}

export function cartTotal(cart: Cart | null): number {
  if (!cart) return 0;
  return Math.round(cart.lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) / 100;
}
