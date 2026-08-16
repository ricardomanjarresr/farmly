"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { getSavedIds } from "@/lib/client-storage";
import type { ListingDTO } from "@/lib/types";

export default function SavedPage() {
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      const ids = getSavedIds();
      if (ids.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }
      fetch("/api/listings")
        .then((r) => r.json())
        .then((all: ListingDTO[]) => {
          setListings(all.filter((l) => ids.includes(l.id)));
          setLoading(false);
        });
    }
    load();
    window.addEventListener("farmly:saved-changed", load);
    return () => window.removeEventListener("farmly:saved-changed", load);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pb-2 pt-4">
        <span className="font-serif text-lg font-bold text-ink">Saved</span>
      </div>
      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>
      ) : listings.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">
          Nothing saved yet — tap the ♡ on a listing to save it here.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
