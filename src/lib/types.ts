export type ListingDTO = {
  id: string;
  item: string;
  category: string;
  unit: string;
  qtyAvailable: number;
  basePrice: number;
  effectivePrice: number;
  percentOff: number;
  isMarkedDown: boolean;
  photoUrl: string | null;
  expiresAt: string | null;
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
    deadline: string;
    status: string;
  } | null;
};

export type ReferencePriceDTO = { source: string; price: number };

export type ListingDetailDTO = ListingDTO & {
  referencePrices: ReferencePriceDTO[];
  moreFromFarm: ListingDTO[];
};

export type CartItem = { listingId: string; qty: number };

export type Cart = {
  farmId: string | null;
  items: CartItem[];
};

export type BuyerSession = {
  telegramId: string;
  name: string;
  username?: string;
  photoUrl?: string;
};

export type OrderSummaryDTO = {
  id: string;
  status: string;
  createdAt: string;
  farm: { id: string; name: string };
  lines: { item: string; qty: number; unit: string; priceAgreed: number }[];
  total: number;
  pool: {
    listingId: string;
    item: string;
    targetQty: number;
    currentQty: number;
    deadline: string;
    status: string;
  } | null;
};
