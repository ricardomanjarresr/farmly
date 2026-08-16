import type { Farm, ShippingPool } from "@/generated/prisma/client";

export type ShippingStatus =
  | { mode: "free_above_min"; minAmount: number }
  | { mode: "flat_fee"; feeAmount: number; radiusKm: number | null }
  | {
      mode: "pooled";
      pool: { targetQty: number; currentQty: number; deadline: string; status: string } | null;
    }
  | { mode: "unknown" };

export function getShippingStatus(
  farm: Pick<
    Farm,
    "shippingMode" | "freeShippingMinAmount" | "flatFeeAmount" | "flatFeeRadiusKm"
  >,
  pool?: Pick<ShippingPool, "targetQty" | "currentQty" | "deadline" | "status"> | null,
): ShippingStatus {
  switch (farm.shippingMode) {
    case "free_above_min":
      return { mode: "free_above_min", minAmount: farm.freeShippingMinAmount ?? 0 };
    case "flat_fee":
      return {
        mode: "flat_fee",
        feeAmount: farm.flatFeeAmount ?? 0,
        radiusKm: farm.flatFeeRadiusKm ?? null,
      };
    case "pooled":
      return {
        mode: "pooled",
        pool: pool
          ? {
              targetQty: pool.targetQty,
              currentQty: pool.currentQty,
              deadline: pool.deadline instanceof Date ? pool.deadline.toISOString() : String(pool.deadline),
              status: pool.status,
            }
          : null,
      };
    default:
      return { mode: "unknown" };
  }
}

export function poolProgressPercent(currentQty: number, targetQty: number): number {
  if (targetQty <= 0) return 0;
  return Math.min(100, Math.round((currentQty / targetQty) * 100));
}

export function daysLeft(deadline: string | Date): number {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const ms = d.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
