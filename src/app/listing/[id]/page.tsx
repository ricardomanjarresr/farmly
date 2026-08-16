import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/listings";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const others = listing.farm.listings.filter((l) => l.id !== listing.id).slice(0, 4);
  const savings = listing.bestReferencePrice
    ? Math.round(((listing.bestReferencePrice.price - listing.pricing.effectivePrice) / listing.bestReferencePrice.price) * 100)
    : null;

  return (
    <div className="max-w-lg mx-auto pb-28">
      <div className="aspect-[4/3] bg-surface-sunk relative">
        {listing.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photoUrl} alt={listing.item} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-ink-faint">🌱</div>
        )}
        <Link
          href="/"
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-sm"
        >
          ←
        </Link>
      </div>
      <div className="px-4 pt-4">
        <div className="font-serif font-bold text-xl text-coral-600 tabular-nums">
          {listing.pricing.isMarkedDown && (
            <span className="text-ink-faint line-through font-normal mr-2 text-base">${listing.pricing.basePrice.toFixed(2)}</span>
          )}
          ${listing.pricing.effectivePrice.toFixed(2)}/{listing.unit}
          {listing.pricing.isMarkedDown && (
            <span className="ml-2 text-xs font-bold text-green-700 bg-green-100 rounded px-2 py-0.5 align-middle">
              {listing.pricing.percentOff}% off - expires soon
            </span>
          )}
        </div>
        {savings !== null && savings > 0 && (
          <div className="mt-1 text-xs font-bold text-coral-600">
            {savings}% less than {listing.bestReferencePrice!.source} (${listing.bestReferencePrice!.price.toFixed(2)})
          </div>
        )}
        <div className="flex items-center gap-2 py-3 border-t border-b border-line my-3">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-sm">🌾</div>
          <div>
            <div className="text-sm font-semibold">{listing.farm.name}</div>
            <div className="text-[11px] text-ink-faint">{listing.farm.town}</div>
          </div>
        </div>

        {listing.shippingPool && (
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-2">Group shipping</p>
            {listing.shippingPool.status === "reached" ? (
              <div className="bg-green-100 text-green-700 text-xs rounded-lg p-3">
                ✅ Free shipping secured — still accepting orders, everyone who joins now also ships free.
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-[11px] text-ink-faint mb-1">
                  <span>
                    {listing.shippingPool.currentQty}/{listing.shippingPool.targetQty}{listing.unit} for free shipping
                  </span>
                </div>
                <div className="h-1.5 rounded bg-surface-sunk overflow-hidden">
                  <div
                    className="h-full bg-green-600"
                    style={{ width: `${Math.min(100, (listing.shippingPool.currentQty / listing.shippingPool.targetQty) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-2">More from {listing.farm.name}</p>
            <div className="flex gap-2 overflow-x-auto">
              {others.map((o) => (
                <Link key={o.id} href={`/listing/${o.id}`} className="flex-none w-[74px]">
                  <div className="w-[74px] h-[74px] rounded-lg bg-surface-sunk flex items-center justify-center overflow-hidden">
                    {o.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.photoUrl} alt={o.item} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🌱</span>
                    )}
                  </div>
                  <div className="text-[10px] text-coral-600 font-bold mt-1">${o.price.toFixed(2)}/{o.unit}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line px-4 py-3 max-w-lg mx-auto">
        <AddToCartButton
          listingId={listing.id}
          item={listing.item}
          unit={listing.unit}
          price={listing.pricing.effectivePrice}
          photoUrl={listing.photoUrl}
          farmId={listing.farmId}
          farmName={listing.farm.name}
        />
      </div>
    </div>
  );
}
