import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeListing } from "@/lib/serialize";

const include = { farm: true, shippingPool: true } as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const category = searchParams.get("category");

  // SQLite's `contains` is case-sensitive and has no `insensitive` mode,
  // so filter in JS instead - dataset is small (hackathon scale).
  let listings = await prisma.listing.findMany({
    where: { status: "active", qtyAvailable: { gt: 0 } },
    include,
    orderBy: { createdAt: "desc" },
  });

  if (category && category !== "all") {
    listings = listings.filter((l) => l.category === category);
  }
  if (q) {
    listings = listings.filter(
      (l) => l.item.toLowerCase().includes(q) || l.farm.name.toLowerCase().includes(q),
    );
  }

  return NextResponse.json(listings.map(serializeListing));
}
