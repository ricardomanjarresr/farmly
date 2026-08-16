import { prisma } from "./prisma";
import { getEffectivePrice, isExpired } from "./pricing";

export async function getActiveListings() {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
    include: { farm: true, shippingPool: true },
    orderBy: { createdAt: "desc" },
  });

  const items = [...new Set(listings.map((l) => l.item))];
  const refPrices = await prisma.referencePrice.findMany({ where: { item: { in: items } } });

  return listings
    .filter((l) => !isExpired(l.expiresAt))
    .map((l) => {
      const pricing = getEffectivePrice(l.price, l.expiresAt);
      const bestRef = refPrices
        .filter((r) => r.item === l.item)
        .sort((a, b) => b.price - a.price)[0];
      return {
        ...l,
        pricing,
        bestReferencePrice: bestRef ?? null,
      };
    });
}

export async function getListingById(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { farm: { include: { listings: { where: { status: "active" } } } }, shippingPool: true },
  });
  if (!listing) return null;
  const refPrices = await prisma.referencePrice.findMany({ where: { item: listing.item } });
  const bestRef = refPrices.sort((a, b) => b.price - a.price)[0] ?? null;
  return { ...listing, pricing: getEffectivePrice(listing.price, listing.expiresAt), bestReferencePrice: bestRef };
}
