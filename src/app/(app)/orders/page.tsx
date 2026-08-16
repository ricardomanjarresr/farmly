"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getBuyerSession } from "@/lib/client-storage";
import type { BuyerSession } from "@/lib/types";

type OrderRow = {
  id: string;
  status: string;
  createdAt: string;
  farm: string;
  lines: { item: string; qty: number; unit: string; photoUrl: string | null }[];
  total: number;
};

export default function OrdersPage() {
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getBuyerSession();
    setSession(s);
    if (!s) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders?telegramId=${encodeURIComponent(s.telegramId)}`)
      .then((r) => r.json())
      .then((data: OrderRow[]) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pb-2 pt-4">
        <span className="font-serif text-lg font-bold text-ink">Orders</span>
      </div>

      {!session ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">
          Log in with Telegram at checkout to see your orders here.
        </p>
      ) : loading ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5 px-4">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-2.5 rounded-xl border border-line p-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-surface-sunk text-lg">
                {o.lines[0]?.photoUrl ? (
                  <Image
                    src={o.lines[0].photoUrl}
                    alt={o.lines[0].item}
                    width={44}
                    height={44}
                    className="h-full w-full rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  "🌿"
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-ink">
                  {o.lines.map((l) => `${l.item} · ${l.qty}${l.unit}`).join(", ")}
                </div>
                <div className="text-[10.5px] text-ink-faint">{o.farm}</div>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-1 text-[9.5px] font-bold ${
                  o.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : "bg-coral-100 text-coral-600"
                }`}
              >
                {o.status === "confirmed" ? "Confirmed" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="px-4 pb-4 pt-3 text-center text-[10.5px] text-ink-faint">
        We look up your orders by your Telegram login — no password.
      </p>
    </div>
  );
}
