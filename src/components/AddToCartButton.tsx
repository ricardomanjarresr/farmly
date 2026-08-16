"use client";

import { useRouter } from "next/navigation";
import { loadCart, saveCart, type Cart } from "@/lib/cart";

export function AddToCartButton({
  listingId,
  item,
  unit,
  price,
  photoUrl,
  farmId,
  farmName,
}: {
  listingId: string;
  item: string;
  unit: string;
  price: number;
  photoUrl: string | null;
  farmId: string;
  farmName: string;
}) {
  const router = useRouter();

  function addToCart() {
    let cart = loadCart();
    if (cart && cart.farmId !== farmId) {
      cart = null; // cart is scoped to one seller - switching farms starts a fresh cart
    }
    if (!cart) {
      cart = { farmId, farmName, lines: [] };
    }
    const existing = cart.lines.find((l) => l.listingId === listingId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.lines.push({ listingId, item, unit, price, qty: 1, photoUrl });
    }
    saveCart(cart);
    router.push("/cart");
  }

  return (
    <button
      onClick={addToCart}
      className="w-full bg-coral-600 text-white rounded-xl py-3 text-sm font-bold"
    >
      Add to cart · ${price.toFixed(2)}/{unit}
    </button>
  );
}
