"use client";

import { useRouter } from "next/navigation";
import { addToCart, getCart } from "@/lib/client-storage";

export default function AddToCartButton({
  farmId,
  farmName,
  listingId,
  price,
  unit,
}: {
  farmId: string;
  farmName: string;
  listingId: string;
  price: number;
  unit: string;
}) {
  const router = useRouter();

  function handleClick() {
    const cart = getCart();
    if (cart.farmId && cart.farmId !== farmId && cart.items.length > 0) {
      const ok = window.confirm(
        `Your cart has items from a different seller. Starting a new cart for ${farmName} will clear it. Continue?`,
      );
      if (!ok) return;
    }
    addToCart(farmId, listingId, 1);
    router.push("/cart");
  }

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-xl bg-coral-600 py-3 text-[13px] font-bold text-white"
    >
      Add to cart · ${price.toFixed(2)}/{unit}
    </button>
  );
}
