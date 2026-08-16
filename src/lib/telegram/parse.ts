const CATEGORY_KEYWORDS: Record<string, string[]> = {
  vegetable: ["tomat", "lettuce", "lechuga", "carrot", "zanahoria", "onion", "cebolla", "pepper", "pimiento", "potato", "papa"],
  fruit: ["strawberr", "fresa", "apple", "manzana", "berry", "peach", "durazno", "grape", "uva"],
  "eggs & dairy": ["egg", "huevo", "milk", "leche", "cheese", "queso", "butter", "mantequilla"],
};

export function inferCategory(item: string): string {
  const lower = item.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "vegetable";
}

export type ParsedSell =
  | { ok: true; item: string; price: number; unit: string; qty: number; expiresAt: Date | null; category: string }
  | { ok: false; error: string };

export function parseSellMessage(text: string): ParsedSell {
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) {
    return {
      ok: false,
      error: "Send it as: item, price, unit, qty, expires (optional)\nExample: Tomatoes, 3.50, lb, 40, 2026-08-21",
    };
  }
  const [item, priceRaw, unit, qtyRaw, expiresRaw, categoryRaw] = parts;
  const price = Number(priceRaw.replace(/[^0-9.]/g, ""));
  const qty = Number(qtyRaw.replace(/[^0-9.]/g, ""));
  if (!item || Number.isNaN(price) || price <= 0 || !unit || Number.isNaN(qty) || qty <= 0) {
    return { ok: false, error: "Couldn't read the price or quantity - make sure they're numbers, e.g. 3.50 and 40" };
  }
  let expiresAt: Date | null = null;
  if (expiresRaw) {
    const parsed = new Date(expiresRaw);
    if (!Number.isNaN(parsed.getTime())) expiresAt = parsed;
  }
  const category = categoryRaw?.trim() || inferCategory(item);
  return { ok: true, item, price, unit, qty, expiresAt, category };
}
