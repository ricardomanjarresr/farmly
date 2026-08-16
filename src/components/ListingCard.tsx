"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedIds, toggleSaved } from "@/lib/client-storage";
import type { ListingDTO } from "@/lib/types";
import { ShippingBadgeCompact } from "./ShippingBadge";

export default function ListingCard({ listing }: { listing: ListingDTO }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getSavedIds().includes(listing.id));
  }, [listing.id]);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-square w-full bg-surface-sunk">
          {listing.photoUrl ? (
            <Image
              src={listing.photoUrl}
              alt={listing.item}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">🌿</div>
          )}
        </div>
      </Link>
      <button
        onClick={() => setSaved(toggleSaved(listing.id))}
        aria-label={saved ? "Unsave" : "Save"}
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[10px] dark:bg-black/55"
      >
        {saved ? "♥" : "♡"}
      </button>
      <Link href={`/listing/${listing.id}`} className="flex flex-1 flex-col px-2 pb-2 pt-1.5">
        <div className="font-serif text-[12.5px] font-bold text-coral-600">
          {listing.isMarkedDown && (
            <span className="mr-1 text-[10px] font-normal text-ink-faint line-through">
              ${listing.basePrice.toFixed(2)}
            </span>
          )}
          ${listing.effectivePrice.toFixed(2)}/{listing.unit}
        </div>
        <div className="line-clamp-2 mb-0.5 min-h-[2.6em] text-[10.5px] leading-tight text-ink">
          {listing.item}
        </div>
        <div className="mt-auto text-[9px] text-ink-faint">{listing.farm.name}</div>
      </Link>
      <ShippingBadgeCompact listing={listing} />
    </div>
  );
}
