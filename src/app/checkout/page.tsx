"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCart, saveCart, cartTotal, type Cart } from "@/lib/cart";

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCart(loadCart());
  }, []);

  async function confirmOrder() {
    if (!cart) return;
    if (!name.trim() || !phone.trim()) {
      setError("Enter your name and phone number first.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, buyerName: name, buyerPhone: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      saveCart(null);
      router.push(`/order-confirmed/${data.orderId}`);
    } catch {
      setError("Couldn't reach the server. Try again.");
      setSubmitting(false);
    }
  }

  if (!cart) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-ink-faint text-sm">Your cart is empty.</div>
    );
  }

  const total = cartTotal(cart);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-serif font-bold text-lg mb-1">Confirm your order</h1>
      <p className="text-[13px] text-ink-faint mb-6">
        {cart.lines.length} item(s) · {cart.farmName} · ${total.toFixed(2)}
      </p>

      <label className="block text-[11px] uppercase tracking-wide text-ink-faint mb-1.5">Your name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="w-full bg-surface-sunk border border-line rounded-lg px-3 py-2.5 text-sm mb-4"
      />

      <label className="block text-[11px] uppercase tracking-wide text-ink-faint mb-1.5">Phone</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="(555) 555-0100"
        className="w-full bg-surface-sunk border border-line rounded-lg px-3 py-2.5 text-sm mb-2"
      />
      <p className="text-[11px] text-ink-faint mb-4">
        No account needed — we look up your orders by this phone number later.
      </p>

      {error && <p className="text-[13px] text-red-600 mb-4">{error}</p>}

      <button
        onClick={confirmOrder}
        disabled={submitting}
        className="w-full bg-coral-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
      >
        {submitting ? "Confirming..." : `Confirm order · $${total.toFixed(2)}`}
      </button>
    </div>
  );
}
