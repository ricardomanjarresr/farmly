import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegramId");
  const phone = searchParams.get("phone");

  if (!telegramId && !phone) {
    return NextResponse.json({ error: "telegramId or phone is required" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: telegramId ? { buyerTelegramChatId: telegramId } : { buyerPhone: phone! },
    include: { lines: { include: { listing: { include: { farm: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const result = orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    farm: order.lines[0]?.listing.farm.name ?? "",
    lines: order.lines.map((l) => ({
      item: l.listing.item,
      qty: l.qty,
      unit: l.listing.unit,
      photoUrl: l.listing.photoUrl,
    })),
    total: Math.round(order.lines.reduce((s, l) => s + l.priceAgreed * l.qty, 0) * 100) / 100,
  }));

  return NextResponse.json(result);
}
