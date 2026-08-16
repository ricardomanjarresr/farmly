"use client";

import { useMemo, useState } from "react";
import { ListingCard, type ListingCardData } from "./ListingCard";

const CATEGORIES = ["All", "vegetable", "fruit", "eggs & dairy"];
const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  vegetable: "Vegetables",
  fruit: "Fruit",
  "eggs & dairy": "Eggs & dairy",
};

export function Feed({ listings }: { listings: (ListingCardData & { category: string })[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesCategory = category === "All" || l.category === category;
      const matchesQuery =
        !query.trim() ||
        l.item.toLowerCase().includes(query.toLowerCase()) ||
        l.farm.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [listings, query, category]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <div className="flex items-center justify-between pt-8 pb-4">
        <span className="font-serif font-bold text-lg text-green-700">🍅 Farmly</span>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tomatoes, eggs, honey..."
        className="w-full bg-surface-sunk border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint mb-3"
      />
      <div className="flex gap-2 overflow-x-auto pb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-none text-xs px-3 py-1.5 rounded-full border ${
              category === c ? "bg-green-600 border-green-600 text-white" : "border-line text-ink-soft"
            }`}
          >
            {CATEGORY_LABELS[c] ?? c}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-ink-faint text-sm py-16">No listings match yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
