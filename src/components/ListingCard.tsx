"use client";

import Link from "next/link";
import { useState } from "react";

export type ListingCardData = {
  id: string;
  item: string;
  unit: string;
  photoUrl: string | null;
  farm: { name: string };
  likeCount: number;
  pricing: { basePrice: number; effectivePrice: number; percentOff: number; isMarkedDown: boolean };
  bestReferencePrice: { source: string; price: number } | null;
  shippingPool: { targetQty: number; currentQty: number; status: string } | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(listing.likeCount);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    await fetch(`/api/listings/${listing.id}/like`, { method: "POST", body: JSON.stringify({ liked: next }) }).catch(() => {});
  }

  const savings = listing.bestReferencePrice
    ? Math.round(((listing.bestReferencePrice.price - listing.pricing.effectivePrice) / listing.bestReferencePrice.price) * 100)
    : null;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block bg-surface border border-line rounded-xl overflow-hidden relative"
    >
      <div className="aspect-square bg-surface-sunk relative">
        {listing.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photoUrl} alt={listing.item} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-ink-faint">🌱</div>
        )}
        <button
          onClick={toggleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/85 dark:bg-black/55 flex items-center justify-center text-xs"
        >
          {liked ? "♥" : "♡"}
        </button>
        {savings !== null && savings > 0 && (
          <div className="absolute top-2 left-2 bg-coral-100 text-coral-600 text-[10px] font-bold px-2 py-1 rounded-md">
            {savings}% less than store
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="font-serif font-bold text-sm text-coral-600 tabular-nums">
          {listing.pricing.isMarkedDown && (
            <span className="text-ink-faint line-through font-normal mr-1.5 text-xs">${listing.pricing.basePrice.toFixed(2)}</span>
          )}
          ${listing.pricing.effectivePrice.toFixed(2)}/{listing.unit}
        </div>
        <div className="text-[13px] text-ink leading-tight mt-0.5 line-clamp-2 min-h-[2.4em]">{listing.item}</div>
        <div className="text-[11px] text-ink-faint mt-0.5">{listing.farm.name}</div>
        {listing.shippingPool && (
          <div className="mt-1.5">
            {listing.shippingPool.status === "reached" ? (
              <div className="text-[10px] font-bold text-green-700 bg-green-100 rounded px-1.5 py-0.5 inline-block">
                ✅ Free shipping secured
              </div>
            ) : (
              <>
                <div className="flex justify-between text-[9px] text-ink-faint mb-0.5">
                  <span>
                    {listing.shippingPool.currentQty}/{listing.shippingPool.targetQty} group ship
                  </span>
                </div>
                <div className="h-1 rounded bg-surface-sunk overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded"
                    style={{ width: `${Math.min(100, (listing.shippingPool.currentQty / listing.shippingPool.targetQty) * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
