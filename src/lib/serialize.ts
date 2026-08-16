import { getEffectivePrice } from "./pricing";
import type { ListingDTO } from "./types";

type ListingWithRelations = {
  id: string;
  item: string;
  category: string;
  unit: string;
  qtyAvailable: number;
  price: number;
  photoUrl: string | null;
  expiresAt: Date | null;
  likeCount: number;
  farm: {
    id: string;
    name: string;
    town: string;
    lat: number | null;
    lng: number | null;
    shippingMode: string;
    freeShippingMinAmount: number | null;
    flatFeeAmount: number | null;
    flatFeeRadiusKm: number | null;
  };
  shippingPool: {
    targetQty: number;
    currentQty: number;
    deadline: Date;
    status: string;
  } | null;
};

export function serializeListing(listing: ListingWithRelations): ListingDTO {
  const pricing = getEffectivePrice(listing.price, listing.expiresAt);
  return {
    id: listing.id,
    item: listing.item,
    category: listing.category,
    unit: listing.unit,
    qtyAvailable: listing.qtyAvailable,
    basePrice: pricing.basePrice,
    effectivePrice: pricing.effectivePrice,
    percentOff: pricing.percentOff,
    isMarkedDown: pricing.isMarkedDown,
    photoUrl: listing.photoUrl,
    expiresAt: listing.expiresAt ? listing.expiresAt.toISOString() : null,
    likeCount: listing.likeCount,
    farm: listing.farm,
    shippingPool: listing.shippingPool
      ? {
          targetQty: listing.shippingPool.targetQty,
          currentQty: listing.shippingPool.currentQty,
          deadline: listing.shippingPool.deadline.toISOString(),
          status: listing.shippingPool.status,
        }
      : null,
  };
}
