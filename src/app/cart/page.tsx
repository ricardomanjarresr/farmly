"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart, getCart, updateCartQty } from "@/lib/client-storage";
import type { Cart, ListingDTO } from "@/lib/types";

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({ farmId: null, items: [] });
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCart(getCart());
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data: ListingDTO[]) => {
        setListings(data);
        setLoading(false);
      });
  }, []);

  function refresh() {
    setCart(getCart());
  }

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-ink-faint">Loading your cart…</p>;
  }

  const cartLines = cart.items
    .map((item) => ({ item, listing: listings.find((l) => l.id === item.listingId) }))
    .filter((l): l is { item: (typeof cart.items)[number]; listing: ListingDTO } => !!l.listing);

  if (cartLines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-ink-faint">Your cart is empty.</p>
        <Link href="/" className="text-sm font-semibold text-green-700 underline">
          Browse the feed
        </Link>
      </div>
    );
  }

  const farm = cartLines[0].listing.farm;
  const subtotal = cartLines.reduce((s, l) => s + l.listing.effectivePrice * l.item.qty, 0);
  const suggestions = listings.filter(
    (l) => l.farm.id === farm.id && !cart.items.some((i) => i.listingId === l.id),
  );

  const remainingForFreeShip =
    farm.shippingMode === "free_above_min" && farm.freeShippingMinAmount
      ? Math.max(0, farm.freeShippingMinAmount - subtotal)
      : 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="font-serif text-lg font-bold text-ink">Your cart</span>
        <Link href="/" className="text-sm text-ink-faint">
          ✕
        </Link>
      </div>

      {farm.shippingMode === "free_above_min" && (
        <div className="mx-4 mb-3 rounded-xl border border-coral-600 bg-coral-100 p-3.5">
          {remainingForFreeShip > 0 ? (
            <>
              <p className="mb-1.5 text-[12.5px] font-bold text-coral-600">
                🚚 Add ${remainingForFreeShip.toFixed(2)} more to unlock free shipping
              </p>
              <p className="mb-2.5 text-[10.5px] text-ink-soft">
                {farm.name} ships free on orders over ${farm.freeShippingMinAmount?.toFixed(2)}.
                You&apos;re at ${subtotal.toFixed(2)}.
              </p>
            </>
          ) : (
            <p className="text-[12.5px] font-bold text-green-700">
              ✅ Free shipping unlocked from {farm.name}
            </p>
          )}
          {suggestions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {suggestions.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    addToCart(farm.id, s.id, 1);
                    refresh();
                  }}
                  className="w-[74px] flex-none text-left"
                >
                  <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-lg bg-surface text-xl">
                    {s.photoUrl ? (
                      <Image
                        src={s.photoUrl}
                        alt={s.item}
                        width={74}
                        height={74}
                        className="h-full w-full rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      "🌿"
                    )}
                    <span className="absolute bottom-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-coral-600 text-xs text-white">
                      +
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold text-coral-600">
                    ${s.effectivePrice.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="px-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
        In your cart · {farm.name}
      </p>
      <div className="flex-1 px-4">
        {cartLines.map(({ item, listing }) => (
          <div key={item.listingId} className="flex items-center gap-2.5 border-b border-line py-2.5">
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-lg bg-surface-sunk text-base">
              {listing.photoUrl ? (
                <Image
                  src={listing.photoUrl}
                  alt={listing.item}
                  width={38}
                  height={38}
                  className="h-full w-full rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                "🌿"
              )}
            </div>
            <div className="flex-1">
              <div className="text-[11.5px] font-semibold text-ink">{listing.item}</div>
              <div className="flex items-center gap-2 text-[10px] text-ink-faint">
                <button
                  onClick={() => {
                    updateCartQty(listing.id, item.qty - 1);
                    refresh();
                  }}
                  className="h-[18px] w-[18px] rounded-full border border-line"
                >
                  −
                </button>
                {item.qty} {listing.unit}
                <button
                  onClick={() => {
                    updateCartQty(listing.id, item.qty + 1);
                    refresh();
                  }}
                  className="h-[18px] w-[18px] rounded-full border border-line"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-[11.5px] font-bold text-ink">
              ${(listing.effectivePrice * item.qty).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line bg-surface px-4 py-3.5">
        <div className="mb-1 flex justify-between text-[11.5px] text-ink-soft">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="mb-2 flex justify-between text-[11.5px] text-ink-soft">
          <span>Delivery</span>
          <span>
            {farm.shippingMode === "free_above_min"
              ? remainingForFreeShip > 0
                ? `Add $${remainingForFreeShip.toFixed(2)} more to get free`
                : "Free"
              : farm.shippingMode === "flat_fee"
                ? `$${farm.flatFeeAmount?.toFixed(2)} flat fee`
                : "Depends on group shipping"}
          </span>
        </div>
        <div className="mb-3 flex justify-between text-[13.5px] font-bold text-ink">
          <span>Total</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <Link
          href="/checkout"
          className="block w-full rounded-xl bg-coral-600 py-3 text-center text-[13px] font-bold text-white"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
