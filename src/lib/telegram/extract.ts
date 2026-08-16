import { inferCategory } from "./parse";

export type ExtractedListing = {
  item: string;
  price: number;
  unit: string;
  qty: number;
  expiresAt: Date | null;
  category: string;
};

const PROMPT = `You are looking at a photo of farm produce for sale, possibly with a caption describing it.
Return ONLY a JSON object (no markdown fences, no extra text) with these fields:
{"item": string, "price": number, "unit": string, "qty": number, "expiresDate": string or null}
- item: the produce name, e.g. "Heirloom tomatoes"
- price: a reasonable price guess per unit in USD if not stated in the caption
- unit: e.g. "lb", "head", "doz", "pt"
- qty: a reasonable quantity guess if not stated
- expiresDate: an ISO date string (YYYY-MM-DD) ONLY if a specific expiry/best-by date is explicitly stated in the caption. Do not guess or compute a date yourself - if no explicit date is stated, return null.
If a caption is provided, prefer any values stated there over your own guess from the photo.`;

export async function extractListingFromPhoto(imageBase64: string, mimeType: string, caption?: string): Promise<ExtractedListing> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: caption ? `${PROMPT}\n\nCaption: ${caption}` : PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text);
  const item = String(parsed.item ?? "").trim();
  const price = Number(parsed.price);
  const unit = String(parsed.unit ?? "").trim();
  const qty = Number(parsed.qty);
  if (!item || Number.isNaN(price) || price <= 0 || !unit || Number.isNaN(qty) || qty <= 0) {
    throw new Error("Gemini returned incomplete listing data");
  }

  let expiresAt: Date | null = null;
  const dateMatch = typeof parsed.expiresDate === "string" && parsed.expiresDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    // Construct from components in local time - new Date("YYYY-MM-DD") parses
    // as UTC midnight, which rolls back a day when displayed in timezones
    // behind UTC (e.g. toDateString() showing the 14th for a 15th expiry).
    const [, y, m, d] = dateMatch;
    expiresAt = new Date(Number(y), Number(m) - 1, Number(d));
  }

  return { item, price, unit, qty, expiresAt, category: inferCategory(item) };
}
