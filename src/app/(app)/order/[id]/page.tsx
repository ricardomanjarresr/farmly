import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { OrderSummaryDTO } from "@/lib/types";
import ShareCard from "@/components/ShareCard";

export const dynamic = "force-dynamic";

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { lines: { include: { listing: { include: { farm: true, shippingPool: true } } } } },
  });
  if (!order) notFound();

  const firstListing = order.lines[0]?.listing;
  const total = order.lines.reduce((s, l) => s + l.priceAgreed * l.qty, 0);
  const pooledLine = order.lines.find((l) => l.listing.shippingPool);
  const pool = pooledLine?.listing.shippingPool;

  const summary: OrderSummaryDTO = {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    farm: { id: firstListing?.farm.id ?? "", name: firstListing?.farm.name ?? "" },
    lines: order.lines.map((l) => ({
      item: l.listing.item,
      qty: l.qty,
      unit: l.listing.unit,
      priceAgreed: l.priceAgreed,
    })),
    total: Math.round(total * 100) / 100,
    pool: pool
      ? {
          listingId: pooledLine!.listingId,
          item: pooledLine!.listing.item,
          targetQty: pool.targetQty,
          currentQty: pool.currentQty,
          deadline: pool.deadline.toISOString(),
          status: pool.status,
        }
      : null,
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto mb-1 mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
        ✓
      </div>
      <h1 className="text-center font-serif text-lg font-bold text-ink">Order confirmed!</h1>
      <p className="mb-1 text-center text-[11.5px] text-ink-faint">
        {summary.lines.length} item{summary.lines.length > 1 ? "s" : ""} · {summary.farm.name} · $
        {summary.total.toFixed(2)}
      </p>
      <p className="mb-4 text-center text-[10.5px] text-ink-faint">
        ✈️ We&apos;ll message you on Telegram with updates
      </p>

      <ShareCard order={summary} />

      <p className="px-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
        Order summary
      </p>
      <div className="px-4">
        {summary.lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between border-b border-line py-2.5 text-[11.5px]">
            <span>
              {l.item} · {l.qty} {l.unit}
            </span>
            <span className="font-bold text-ink">${(l.priceAgreed * l.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 py-4">
        <Link
          href="/"
          className="block w-full rounded-xl bg-coral-600 py-3 text-center text-[13px] font-bold text-white"
        >
          Continue browsing
        </Link>
      </div>
    </div>
  );
}
