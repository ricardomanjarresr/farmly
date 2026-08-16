import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderSummaryDTO } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lines: { include: { listing: { include: { farm: true, shippingPool: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const firstListing = order.lines[0]?.listing;
  const total = order.lines.reduce((sum, l) => sum + l.priceAgreed * l.qty, 0);
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

  return NextResponse.json(summary);
}
