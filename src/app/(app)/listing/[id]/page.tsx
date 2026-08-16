import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeListing } from "@/lib/serialize";
import { ShippingSection } from "@/components/ShippingBadge";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { farm: true, shippingPool: true },
  });
  if (!listing) notFound();

  const [moreFromFarm, referencePrices] = await Promise.all([
    prisma.listing.findMany({
      where: { farmId: listing.farmId, id: { not: listing.id }, status: "active", qtyAvailable: { gt: 0 } },
      include: { farm: true, shippingPool: true },
      take: 6,
    }),
    prisma.referencePrice.findMany({ where: { item: listing.item } }),
  ]);

  const dto = serializeListing(listing);

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative aspect-[4/3] w-full bg-surface-sunk">
        <Link
          href="/"
          className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm dark:bg-black/60"
        >
          ←
        </Link>
        {dto.photoUrl ? (
          <Image src={dto.photoUrl} alt={dto.item} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🌿</div>
        )}
      </div>

      <div className="px-4 py-3.5">
        <div className="font-serif text-xl font-bold text-coral-600">
          {dto.isMarkedDown && (
            <span className="mr-2 text-sm font-normal text-ink-faint line-through">
              ${dto.basePrice.toFixed(2)}
            </span>
          )}
          ${dto.effectivePrice.toFixed(2)}/{dto.unit}
          {dto.isMarkedDown && (
            <span className="ml-2 rounded bg-coral-100 px-1.5 py-0.5 text-[10px] font-bold text-coral-600">
              {dto.percentOff}% off · sells soon
            </span>
          )}
        </div>
        <p className="mb-2 mt-0.5 text-[13.5px] text-ink">{dto.item}</p>

        <div className="mb-3 flex items-center gap-2 border-y border-line py-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-green-100 text-xs">
            🌾
          </div>
          <div>
            <div className="text-xs font-semibold text-ink">{dto.farm.name}</div>
            <div className="text-[10.5px] text-ink-faint">{dto.farm.town}</div>
          </div>
        </div>

        <ShippingSection listing={dto} />

        {referencePrices.length > 0 && (
          <div className="mb-3.5">
            <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
              Price check
            </p>
            <div className="flex flex-wrap gap-1.5">
              {referencePrices.map((rp) => (
                <span
                  key={rp.source}
                  className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink-soft"
                >
                  {rp.source}: ${rp.price.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        )}

        {moreFromFarm.length > 0 && (
          <div className="mb-2">
            <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
              More from {dto.farm.name}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {moreFromFarm.map((m) => {
                const md = serializeListing(m);
                return (
                  <Link key={m.id} href={`/listing/${m.id}`} className="w-[74px] flex-none">
                    <div className="flex h-[74px] w-[74px] items-center justify-center rounded-lg bg-surface-sunk text-xl">
                      {md.photoUrl ? (
                        <Image
                          src={md.photoUrl}
                          alt={md.item}
                          width={74}
                          height={74}
                          className="h-full w-full rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        "🌿"
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold text-coral-600">
                      ${md.effectivePrice.toFixed(2)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-line bg-surface px-4 py-3.5">
        <AddToCartButton
          farmId={dto.farm.id}
          farmName={dto.farm.name}
          listingId={dto.id}
          price={dto.effectivePrice}
          unit={dto.unit}
        />
      </div>
    </div>
  );
}
