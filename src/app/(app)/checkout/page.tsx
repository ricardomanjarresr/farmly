"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCart, getBuyerSession, getCart } from "@/lib/client-storage";
import type { BuyerSession, Cart, ListingDTO } from "@/lib/types";
import TelegramLoginButton from "@/components/TelegramLoginButton";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ farmId: null, items: [] });
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCart(getCart());
    setSession(getBuyerSession());
    fetch("/api/listings")
      .then((r) => r.json())
      .then(setListings);
  }, []);

  const cartLines = cart.items
    .map((item) => ({ item, listing: listings.find((l) => l.id === item.listingId) }))
    .filter((l): l is { item: (typeof cart.items)[number]; listing: ListingDTO } => !!l.listing);

  if (cartLines.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink-faint">Your cart is empty.</p>;
  }

  const farm = cartLines[0].listing.farm;
  const total = cartLines.reduce((s, l) => s + l.listing.effectivePrice * l.item.qty, 0);

  async function placeOrder() {
    if (!session) {
      setError("Log in with Telegram first");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items,
          buyerName: session.name,
          buyerPhone: phone,
          buyerTelegramChatId: session.telegramId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      clearCart();
      router.push(`/order/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-4">
      <h1 className="mb-1 font-serif text-lg font-bold text-ink">Confirm your order</h1>
      <p className="mb-4 text-[11px] text-ink-faint">
        {cartLines.length} item{cartLines.length > 1 ? "s" : ""} · {farm.name} · ${total.toFixed(2)}
      </p>

      {!session ? (
        <>
          <p className="mb-3 text-[11px] text-ink-soft">
            Log in to confirm — we&apos;ll message you on Telegram when your order updates.
          </p>
          <TelegramLoginButton onLoggedIn={setSession} />
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-surface-sunk px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-base">
              🙂
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">{session.name}</div>
              <div className="text-[10px] text-ink-faint">
                {session.username ? `@${session.username} · ` : ""}logged in
              </div>
            </div>
          </div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink-faint">
            Phone (optional, for delivery)
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(617) 555-0148"
            className="mb-4 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px]"
          />
        </>
      )}

      {error && <p className="mb-3 text-[11px] text-coral-600">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={!session || placing}
        className="mt-auto w-full rounded-xl bg-coral-600 py-3 text-[13px] font-bold text-white disabled:opacity-50"
      >
        {placing ? "Placing order…" : `Confirm order · $${total.toFixed(2)}`}
      </button>
    </div>
  );
}
