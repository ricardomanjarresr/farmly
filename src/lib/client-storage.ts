"use client";

import type { BuyerSession, Cart } from "./types";

const CART_KEY = "farmly_cart";
const SESSION_KEY = "farmly_buyer";
const SAVED_KEY = "farmly_saved";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCart(): Cart {
  return read<Cart>(CART_KEY, { farmId: null, items: [] });
}

export function setCart(cart: Cart) {
  write(CART_KEY, cart);
  window.dispatchEvent(new Event("farmly:cart-changed"));
}

export function clearCart() {
  setCart({ farmId: null, items: [] });
}

/** Adding a listing from a different farm than what's already in the cart replaces the cart (per-seller cart, decision #18). */
export function addToCart(farmId: string, listingId: string, qty: number) {
  const current = getCart();
  const cart: Cart = current.farmId === farmId ? current : { farmId, items: [] };
  const existing = cart.items.find((i) => i.listingId === listingId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({ listingId, qty });
  }
  setCart(cart);
}

export function updateCartQty(listingId: string, qty: number) {
  const cart = getCart();
  if (qty <= 0) {
    cart.items = cart.items.filter((i) => i.listingId !== listingId);
  } else {
    const existing = cart.items.find((i) => i.listingId === listingId);
    if (existing) existing.qty = qty;
  }
  if (cart.items.length === 0) cart.farmId = null;
  setCart(cart);
}

export function getBuyerSession(): BuyerSession | null {
  return read<BuyerSession | null>(SESSION_KEY, null);
}

export function setBuyerSession(session: BuyerSession) {
  write(SESSION_KEY, session);
  window.dispatchEvent(new Event("farmly:session-changed"));
}

export function clearBuyerSession() {
  write(SESSION_KEY, null);
  window.dispatchEvent(new Event("farmly:session-changed"));
}

export function getSavedIds(): string[] {
  return read<string[]>(SAVED_KEY, []);
}

export function toggleSaved(listingId: string): boolean {
  const saved = getSavedIds();
  const idx = saved.indexOf(listingId);
  let nowSaved: boolean;
  if (idx >= 0) {
    saved.splice(idx, 1);
    nowSaved = false;
  } else {
    saved.push(listingId);
    nowSaved = true;
  }
  write(SAVED_KEY, saved);
  window.dispatchEvent(new Event("farmly:saved-changed"));
  return nowSaved;
}
