import { prisma } from "@/lib/prisma";
import { serializeListing } from "@/lib/serialize";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const listings = await prisma.listing.findMany({
    where: { status: "active", qtyAvailable: { gt: 0 } },
    include: { farm: true, shippingPool: true },
    orderBy: { createdAt: "desc" },
  });
  const dtos = listings.map(serializeListing);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="font-serif text-lg font-bold text-green-700">🍅 Farmly</span>
      </div>
      {dtos.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-ink-faint">
          No listings yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-4">
          {dtos.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
