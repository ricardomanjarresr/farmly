import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePrice } from "@/lib/pricing";
import type { OrderSummaryDTO } from "@/lib/types";

type CheckoutBody = {
  items: { listingId: string; qty: number }[];
  buyerName: string;
  buyerPhone?: string;
  buyerTelegramChatId?: string;
  buyerLat?: number;
  buyerLng?: number;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CheckoutBody;

  if (!body.buyerName?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!body.items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const listingIds = body.items.map((i) => i.listingId);
      const listings = await tx.listing.findMany({
        where: { id: { in: listingIds } },
        include: { farm: true, shippingPool: true },
      });

      if (listings.length !== listingIds.length) {
        throw new Error("One or more items are no longer available");
      }
      const farmIds = new Set(listings.map((l) => l.farmId));
      if (farmIds.size > 1) {
        throw new Error("Cart can only contain items from one seller");
      }

      const created = await tx.order.create({
        data: {
          buyerName: body.buyerName.trim(),
          buyerPhone: body.buyerPhone?.trim() || "",
          buyerLat: body.buyerLat,
          buyerLng: body.buyerLng,
          buyerTelegramChatId: body.buyerTelegramChatId,
          status: "pending",
        },
      });

      for (const item of body.items) {
        const listing = listings.find((l) => l.id === item.listingId)!;
        if (item.qty <= 0 || item.qty > listing.qtyAvailable) {
          throw new Error(`Not enough ${listing.item} available`);
        }
        const { effectivePrice } = getEffectivePrice(listing.price, listing.expiresAt);

        await tx.orderLine.create({
          data: {
            orderId: created.id,
            listingId: listing.id,
            qty: item.qty,
            priceAgreed: effectivePrice,
          },
        });

        await tx.listing.update({
          where: { id: listing.id },
          data: { qtyAvailable: { decrement: item.qty } },
        });

        if (listing.shippingPool && listing.shippingPool.status === "open") {
          const newQty = listing.shippingPool.currentQty + item.qty;
          await tx.shippingPool.update({
            where: { listingId: listing.id },
            data: {
              currentQty: newQty,
              status: newQty >= listing.shippingPool.targetQty ? "reached" : "open",
            },
          });
        }
      }

      return created;
    });

    const summary = await buildOrderSummary(order.id);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function buildOrderSummary(orderId: string): Promise<OrderSummaryDTO> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      lines: { include: { listing: { include: { farm: true, shippingPool: true } } } },
    },
  });

  const firstListing = order.lines[0]?.listing;
  const total = order.lines.reduce((sum, l) => sum + l.priceAgreed * l.qty, 0);
  const pooledLine = order.lines.find((l) => l.listing.shippingPool);
  const pool = pooledLine?.listing.shippingPool;

  return {
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
}
