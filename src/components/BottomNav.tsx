"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Feed", icon: "▦" },
  { href: "/search", label: "Search", icon: "⌕" },
  { href: "/saved", label: "Saved", icon: "♡" },
  { href: "/orders", label: "Orders", icon: "▤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md justify-around border-t border-line bg-surface px-2 pb-3 pt-2">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] ${
              active ? "font-bold text-green-700" : "text-ink-faint"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
