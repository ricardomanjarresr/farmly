"use client";

import { daysLeft, poolProgressPercent } from "@/lib/shipping";
import type { OrderSummaryDTO } from "@/lib/types";

export default function ShareCard({ order }: { order: OrderSummaryDTO }) {
  const pool = order.pool;
  if (!pool || pool.status === "reached") return null;

  const pct = poolProgressPercent(pool.currentQty, pool.targetQty);
  const shareText = `Help us reach free shipping from ${order.farm.name} on Farmly 🍅 — we're at ${pool.currentQty}/${pool.targetQty} for ${pool.item}!`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/listing/${pool.listingId}` : "";

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
      } catch {
        // user cancelled - no-op
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Link copied!");
    }
  }

  return (
    <div className="mx-4 mb-4 rounded-xl border border-coral-600 bg-coral-100 p-3.5">
      <p className="mb-1.5 text-[12.5px] font-bold text-coral-600">
        🚚 You just joined the group — {pool.currentQty}/{pool.targetQty}
      </p>
      <p className="mb-2.5 text-[10.5px] text-ink-soft">
        {order.farm.name} ships free once the group hits {pool.targetQty}, in {daysLeft(pool.deadline)} days.
        Share to help get there faster:
      </p>
      <div className="mb-2 h-[6px] overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-[11.5px] font-bold text-white"
        >
          📱 Share on WhatsApp
        </button>
        <button
          onClick={shareNative}
          className="flex w-10 flex-none items-center justify-center rounded-lg border border-line bg-surface text-sm"
          aria-label="Share"
        >
          ⇪
        </button>
      </div>
    </div>
  );
}
