import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farm = await prisma.farm.findUnique({
    where: { id },
    include: { listings: { where: { status: "active" } } },
  });
  if (!farm) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    shippingMode: farm.shippingMode,
    freeShippingMinAmount: farm.freeShippingMinAmount,
    listings: farm.listings.map((l) => ({ id: l.id, item: l.item, unit: l.unit, price: l.price, photoUrl: l.photoUrl })),
  });
}
