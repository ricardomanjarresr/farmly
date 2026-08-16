import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeListing } from "@/lib/serialize";
import type { ListingDetailDTO } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { farm: true, shippingPool: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const [moreFromFarm, referencePrices] = await Promise.all([
    prisma.listing.findMany({
      where: {
        farmId: listing.farmId,
        id: { not: listing.id },
        status: "active",
        qtyAvailable: { gt: 0 },
      },
      include: { farm: true, shippingPool: true },
      take: 6,
    }),
    prisma.referencePrice.findMany({ where: { item: listing.item } }),
  ]);

  const detail: ListingDetailDTO = {
    ...serializeListing(listing),
    referencePrices: referencePrices.map((rp) => ({ source: rp.source, price: rp.price })),
    moreFromFarm: moreFromFarm.map(serializeListing),
  };

  return NextResponse.json(detail);
}
