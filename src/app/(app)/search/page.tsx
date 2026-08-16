"use client";

import { useEffect, useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import type { ListingDTO } from "@/lib/types";

const CATEGORIES = ["all", "vegetable", "fruit", "eggs & dairy"];
const RECENT_KEY = "farmly_recent_searches";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [sortNearest, setSortNearest] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw) setRecent(JSON.parse(raw));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    fetch(`/api/listings?${params}`)
      .then((r) => r.json())
      .then(setListings);
  }, [query, category]);

  function runSearch(term: string) {
    setQuery(term);
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  function enableNearest() {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortNearest(true);
      },
      () => setGeoDenied(true),
    );
  }

  const sorted = useMemo(() => {
    if (!sortNearest || !coords) return listings;
    const distanceOf = (l: ListingDTO) =>
      l.farm.lat != null && l.farm.lng != null
        ? haversineKm(coords.lat, coords.lng, l.farm.lat, l.farm.lng)
        : Infinity;
    return [...listings].sort((a, b) => distanceOf(a) - distanceOf(b));
  }, [listings, sortNearest, coords]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pb-2 pt-4">
        <span className="font-serif text-lg font-bold text-ink">Search</span>
      </div>
      <div className="mx-4 mb-2.5 flex items-center gap-1.5 rounded-lg border border-line bg-surface-sunk px-3 py-2">
        <span className="text-ink-faint">⌕</span>
        <input
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="tomatoes, farmer, honey…"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />
      </div>
      <div className="mb-2 flex gap-1.5 overflow-x-auto px-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-none whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] ${
              category === c
                ? "border-green-600 bg-green-600 text-white"
                : "border-line text-ink-soft"
            }`}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <button
        onClick={enableNearest}
        className="mx-4 mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-soft"
      >
        ↕ Sort by: {sortNearest ? "Nearest" : "Default"}
      </button>
      {geoDenied && (
        <p className="mx-4 mb-2 text-[10.5px] text-ink-faint">
          Location unavailable — showing default order instead.
        </p>
      )}

      {recent.length > 0 && (
        <>
          <p className="px-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
            Recent searches
          </p>
          <div className="mb-2 flex gap-1.5 overflow-x-auto px-4">
            {recent.map((r) => (
              <button
                key={r}
                onClick={() => runSearch(r)}
                className="flex-none whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-soft"
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}

      {sorted.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">No results.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-4">
          {sorted.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
