import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrderConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { lines: { include: { listing: { include: { farm: true, shippingPool: true } } } } },
  });
  if (!order) notFound();

  const total = order.lines.reduce((sum, l) => sum + l.priceAgreed * l.qty, 0);
  const farmName = order.lines[0]?.listing.farm.name ?? "";

  // Show the share/pool card only for the one line that's in an active,
  // not-yet-reached pool - matches decision #19 (not shown on every order).
  const poolLine = order.lines.find((l) => l.listing.shippingPool && l.listing.shippingPool.status === "open");
  const pool = poolLine?.listing.shippingPool;

  const shareText = pool
    ? `Help us reach free shipping from ${poolLine!.listing.farm.name}! Join here:`
    : "";
  const shareUrl = typeof process.env.NEXT_PUBLIC_SITE_URL === "string" ? process.env.NEXT_PUBLIC_SITE_URL : "";
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl mx-auto mb-3">
        ✓
      </div>
      <h1 className="font-serif font-bold text-lg text-center mb-1">Order confirmed!</h1>
      <p className="text-[13px] text-ink-faint text-center mb-6">
        {order.lines.length} item(s) · {farmName} · ${total.toFixed(2)}
      </p>

      {pool && (
        <div className="bg-coral-100 border border-coral-600 rounded-xl p-4 mb-6">
          <div className="text-[13px] font-bold text-coral-600 mb-1.5">
            🚚 You just joined the group — {pool.currentQty}/{pool.targetQty}
          </div>
          <p className="text-[11px] text-ink-soft mb-3">
            {poolLine!.listing.farm.name} ships free once the group hits {pool.targetQty}, by{" "}
            {new Date(pool.deadline).toLocaleDateString()}. Share to help get there faster:
          </p>
          <div className="flex gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white rounded-lg py-2.5 text-[13px] font-bold"
            >
              📱 Share on WhatsApp
            </a>
          </div>
        </div>
      )}

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-2">Order summary</p>
      {order.lines.map((l) => (
        <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-line">
          <div className="w-10 h-10 rounded-lg bg-surface-sunk flex items-center justify-center overflow-hidden flex-none">
            {l.listing.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.listing.photoUrl} alt={l.listing.item} className="w-full h-full object-cover" />
            ) : (
              <span>🌱</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{l.listing.item}</div>
            <div className="text-[11px] text-ink-faint">
              {l.qty} {l.listing.unit}
            </div>
          </div>
          <div className="text-[13px] font-bold tabular-nums">${(l.priceAgreed * l.qty).toFixed(2)}</div>
        </div>
      ))}

      <Link
        href="/"
        className="block text-center w-full bg-surface-sunk border border-line rounded-xl py-3 text-sm font-bold mt-6"
      >
        Continue browsing
      </Link>
    </div>
  );
}
