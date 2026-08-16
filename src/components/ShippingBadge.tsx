import { daysLeft, poolProgressPercent } from "@/lib/shipping";
import type { ListingDTO } from "@/lib/types";

/** Compact version for feed/search cards - pooled mode only, per the mockup. */
export function ShippingBadgeCompact({ listing }: { listing: ListingDTO }) {
  if (listing.farm.shippingMode !== "pooled" || !listing.shippingPool) return null;
  const pool = listing.shippingPool;

  if (pool.status === "reached") {
    return (
      <div className="px-2 pb-2">
        <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[8.5px] font-bold text-green-700">
          ✅ Free shipping secured
        </span>
      </div>
    );
  }

  const pct = poolProgressPercent(pool.currentQty, pool.targetQty);
  return (
    <div className="px-2 pb-2">
      <div className="mb-0.5 flex justify-between text-[8.5px] text-ink-faint">
        <span>
          {pool.currentQty}/{pool.targetQty} group ship
        </span>
        <span>{daysLeft(pool.deadline)}d</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-surface-sunk">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Full version for the product detail screen. */
export function ShippingSection({ listing }: { listing: ListingDTO }) {
  const { farm, shippingPool } = listing;

  if (farm.shippingMode === "pooled" && shippingPool) {
    const pct = poolProgressPercent(shippingPool.currentQty, shippingPool.targetQty);
    if (shippingPool.status === "reached") {
      return (
        <div className="mb-3.5 rounded-xl border border-green-600 bg-green-100 p-3">
          <p className="text-xs font-bold text-green-700">✅ Free shipping secured</p>
          <p className="mt-1 text-[10.5px] text-green-700">
            The group hit {shippingPool.targetQty}
            {listing.unit} — still open, everyone who orders now also ships free.
          </p>
        </div>
      );
    }
    return (
      <div className="mb-3.5">
        <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
          Group shipping
        </p>
        <div className="mb-1 flex justify-between text-[10.5px]">
          <span>
            {shippingPool.currentQty}/{shippingPool.targetQty}
            {listing.unit} for free shipping
          </span>
          <span>{daysLeft(shippingPool.deadline)} days left</span>
        </div>
        <div className="h-[7px] overflow-hidden rounded-full bg-surface-sunk">
          <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] text-ink-faint">
          If the group doesn&apos;t fill before the deadline, we&apos;ll ask you to confirm a
          delivery fee.
        </p>
      </div>
    );
  }

  if (farm.shippingMode === "free_above_min") {
    return (
      <p className="mb-3.5 text-[11px] text-ink-soft">
        🚚 Free shipping on orders over{" "}
        <b className="text-ink">${farm.freeShippingMinAmount?.toFixed(2)}</b> from {farm.name}.
      </p>
    );
  }

  if (farm.shippingMode === "flat_fee") {
    return (
      <p className="mb-3.5 text-[11px] text-ink-soft">
        🚚 Flat ${farm.flatFeeAmount?.toFixed(2)} delivery
        {farm.flatFeeRadiusKm ? ` within ${farm.flatFeeRadiusKm}km` : ""} from {farm.name}.
      </p>
    );
  }

  return null;
}
