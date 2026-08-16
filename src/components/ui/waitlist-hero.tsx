"use client";

import { useState } from "react";

const NOTES = [
  { emoji: "🍅", title: "Heirloom tomatoes, picked this morning", user: "Rio Verde Farm", likes: 128, tall: true },
  { emoji: "🥚", title: "Pasture-raised eggs, 12ct", user: "Green Valley", likes: 64, tall: false },
  { emoji: "🍓", title: "Strawberries — last of the season 🍓", user: "Rio Verde Farm", likes: 341, tall: false },
  { emoji: "🥬", title: "Butter lettuce, zero pesticides", user: "Sunrise Acres", likes: 52, tall: true },
  { emoji: "🍯", title: "Raw wildflower honey, small batch", user: "Green Valley", likes: 219, tall: false },
  { emoji: "🌽", title: "Sweet corn — only 6 left today", user: "Sunrise Acres", likes: 37, tall: false },
];

const CATEGORIES = ["For farmers", "For buyers", "Group shipping", "Discovery feed", "No app to install"];

function NoteCard({ note, className = "" }: { note: (typeof NOTES)[number]; className?: string }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-[#f0e4e0] bg-white shadow-[0_10px_30px_-18px_rgba(255,36,66,0.35)] ${className}`}
    >
      <div
        className={`flex items-center justify-center bg-[#fff3ee] text-4xl ${note.tall ? "h-44" : "h-32"}`}
      >
        {note.emoji}
      </div>
      <div className="p-3">
        <p className="mb-2 line-clamp-2 text-[13px] font-medium leading-snug text-[#1a1a1a]">
          {note.title}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-[#ffd9cc]" />
            <span className="text-[11px] text-[#8a8580]">{note.user}</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-[#8a8580]">
            ♥ {note.likes}
          </span>
        </div>
      </div>
    </div>
  );
}

export function WaitlistHero() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setStatus("submitted");
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff2442] text-base">
            🍅
          </span>
          <span className="text-[17px] font-bold text-[#1a1a1a]">Farmly</span>
        </div>
        <div className="hidden gap-1 rounded-full border border-[#f0e4e0] bg-[#fafafa] p-1 md:flex">
          {CATEGORIES.slice(0, 3).map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-3 py-1.5 text-[12.5px] ${
                i === 0 ? "bg-[#ff2442] text-white font-semibold" : "text-[#8a8580]"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-20">
        <div>
          <span className="mb-4 inline-block rounded-full bg-[#fff0ed] px-3 py-1 text-[12px] font-semibold text-[#ff2442]">
            Coming soon
          </span>
          <h1 className="mb-4 text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-[#1a1a1a] md:text-[3.25rem]">
            Fresh, local,
            <br />
            discovered daily.
          </h1>
          <p className="mb-7 max-w-md text-[15px] leading-relaxed text-[#6b6560]">
            Farmly is a discovery feed for what&apos;s actually growing near you — farmers post in
            seconds on Telegram, buyers scroll, save, and check out like it&apos;s their favorite
            app. Be first in when we open the gate.
          </p>

          {status === "idle" ? (
            <form onSubmit={handleSubmit} className="flex max-w-md gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-full border border-[#e8e0db] bg-[#fafafa] px-4 py-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#b0aaa5] focus:border-[#ff2442]"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-full bg-[#ff2442] px-6 py-3 text-[14px] font-bold text-white transition hover:bg-[#e6203b]"
              >
                Join waitlist
              </button>
            </form>
          ) : (
            <div className="flex max-w-md items-center gap-2 rounded-full border border-[#ffd9cc] bg-[#fff3ee] px-4 py-3 text-[14px] font-semibold text-[#ff2442]">
              ✓ You&apos;re on the list — we&apos;ll be in touch.
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#ffd9cc", "#d6f0da", "#fde68a"].map((c, i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-white"
                  style={{ background: c }}
                />
              ))}
            </div>
            <span className="text-[12.5px] text-[#8a8580]">
              Farmers &amp; buyers already signed up in 3 towns
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3 pt-8">
              <NoteCard note={NOTES[0]} />
              <NoteCard note={NOTES[3]} />
            </div>
            <div className="flex flex-col gap-3">
              <NoteCard note={NOTES[1]} />
              <NoteCard note={NOTES[2]} />
              <NoteCard note={NOTES[4]} />
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,36,66,0.08),transparent_60%)]" />
        </div>
      </div>
    </section>
  );
}
