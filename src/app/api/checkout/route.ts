import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Cart } from "@/lib/cart";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cart, buyerName, buyerPhone } = body as { cart: Cart; buyerName: string; buyerPhone: string };

  if (!cart || !cart.lines?.length || !buyerName?.trim() || !buyerPhone?.trim()) {
    return NextResponse.json({ error: "Missing cart or buyer info" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: { buyerName: buyerName.trim(), buyerPhone: buyerPhone.trim(), status: "pending" },
      });

      for (const line of cart.lines) {
        const listing = await tx.listing.findUnique({ where: { id: line.listingId }, include: { shippingPool: true } });
        if (!listing || listing.status !== "active") throw new Error(`Listing ${line.listingId} is no longer available`);
        if (listing.qtyAvailable < line.qty) throw new Error(`Not enough ${listing.item} left`);

        await tx.orderLine.create({
          data: { orderId: createdOrder.id, listingId: line.listingId, qty: line.qty, priceAgreed: line.price },
        });

        const newQty = listing.qtyAvailable - line.qty;
        await tx.listing.update({
          where: { id: line.listingId },
          data: { qtyAvailable: newQty, status: newQty <= 0 ? "sold_out" : "active" },
        });

        if (listing.shippingPool) {
          const newPoolQty = listing.shippingPool.currentQty + line.qty;
          await tx.shippingPool.update({
            where: { id: listing.shippingPool.id },
            data: {
              currentQty: newPoolQty,
              status: newPoolQty >= listing.shippingPool.targetQty ? "reached" : listing.shippingPool.status,
            },
          });
        }
      }

      return createdOrder;
    });

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
