"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadCart, saveCart, cartTotal, type Cart } from "@/lib/cart";

type UpsellItem = { id: string; item: string; unit: string; price: number; photoUrl: string | null };

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [shippingMode, setShippingMode] = useState<string | null>(null);
  const [freeShippingMin, setFreeShippingMin] = useState<number | null>(null);
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const c = loadCart();
    setCart(c);
    if (c) {
      fetch(`/api/farms/${c.farmId}/upsell`)
        .then((r) => r.json())
        .then((data) => {
          setShippingMode(data.shippingMode);
          setFreeShippingMin(data.freeShippingMinAmount);
          const cartIds = new Set(c.lines.map((l) => l.listingId));
          setUpsellItems(data.listings.filter((l: UpsellItem) => !cartIds.has(l.id)).slice(0, 4));
        })
        .catch(() => {});
    }
  }, []);

  function updateCart(next: Cart) {
    saveCart(next);
    setCart({ ...next });
  }

  function addUpsellItem(item: UpsellItem) {
    if (!cart) return;
    const next = { ...cart, lines: [...cart.lines, { listingId: item.id, item: item.item, unit: item.unit, price: item.price, qty: 1, photoUrl: item.photoUrl }] };
    updateCart(next);
    setUpsellItems((prev) => prev.filter((u) => u.id !== item.id));
  }

  function removeLine(listingId: string) {
    if (!cart) return;
    const lines = cart.lines.filter((l) => l.listingId !== listingId);
    if (lines.length === 0) {
      saveCart(null);
      setCart(null);
    } else {
      updateCart({ ...cart, lines });
    }
  }

  if (!cart) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-ink-faint text-sm mb-4">Your cart is empty.</p>
        <Link href="/" className="text-green-700 text-sm font-semibold">
          Browse the feed
        </Link>
      </div>
    );
  }

  const total = cartTotal(cart);
  const remaining = shippingMode === "free_above_min" && freeShippingMin ? Math.max(0, freeShippingMin - total) : 0;

  return (
    <div className="max-w-lg mx-auto pb-32">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <span className="font-serif font-bold text-lg">Your cart</span>
        <Link href="/" className="text-ink-faint">
          ✕
        </Link>
      </div>

      {shippingMode === "free_above_min" && freeShippingMin && (
        <div className="mx-4 mb-4 bg-coral-100 border border-coral-600 rounded-xl p-3">
          {remaining > 0 ? (
            <>
              <div className="text-xs font-bold text-coral-600 mb-1">🚚 Add ${remaining.toFixed(2)} more to unlock free shipping</div>
              <div className="text-[11px] text-ink-soft mb-2">
                {cart.farmName} ships free on orders over ${freeShippingMin.toFixed(2)}. You&apos;re at ${total.toFixed(2)}.
              </div>
            </>
          ) : (
            <div className="text-xs font-bold text-green-700">✅ Free shipping unlocked</div>
          )}
          {upsellItems.length > 0 && remaining > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {upsellItems.map((u) => (
                <button key={u.id} onClick={() => addUpsellItem(u)} className="flex-none w-[74px] text-left">
                  <div className="w-[74px] h-[74px] rounded-lg bg-surface-sunk relative flex items-center justify-center overflow-hidden">
                    {u.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.photoUrl} alt={u.item} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🌱</span>
                    )}
                    <span className="absolute bottom-1 right-1 w-[18px] h-[18px] rounded-full bg-coral-600 text-white text-xs flex items-center justify-center">
                      +
                    </span>
                  </div>
                  <div className="text-[10px] text-coral-600 font-bold mt-1">${u.price.toFixed(2)}/{u.unit}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint px-4 mb-2">In your cart</p>
      {cart.lines.map((line) => (
        <div key={line.listingId} className="flex items-center gap-3 px-4 py-2.5 border-b border-line">
          <div className="w-10 h-10 rounded-lg bg-surface-sunk flex items-center justify-center overflow-hidden flex-none">
            {line.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={line.photoUrl} alt={line.item} className="w-full h-full object-cover" />
            ) : (
              <span>🌱</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{line.item}</div>
            <div className="text-[11px] text-ink-faint">
              {line.qty} {line.unit}
            </div>
          </div>
          <div className="text-[13px] font-bold tabular-nums">${(line.price * line.qty).toFixed(2)}</div>
          <button onClick={() => removeLine(line.listingId)} className="text-ink-faint text-xs ml-1">
            ✕
          </button>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line px-4 py-3 max-w-lg mx-auto">
        <div className="flex justify-between text-[13px] text-ink-soft mb-1">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-ink-soft mb-2">
          <span>Delivery</span>
          <span>{remaining > 0 ? `Add $${remaining.toFixed(2)} more to get free` : shippingMode === "flat_fee" ? "Flat fee at checkout" : "Free"}</span>
        </div>
        <div className="flex justify-between text-base font-bold mb-3">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-coral-600 text-white rounded-xl py-3 text-sm font-bold"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
