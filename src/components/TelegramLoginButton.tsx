"use client";

import { useEffect, useRef, useState } from "react";
import { setBuyerSession } from "@/lib/client-storage";
import type { BuyerSession } from "@/lib/types";

const BOT_USERNAME = "farmly_demo_bot";

type TelegramAuthUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onFarmlyTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

export default function TelegramLoginButton({
  onLoggedIn,
}: {
  onLoggedIn: (session: BuyerSession) => void;
}) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isLocalhost, setIsLocalhost] = useState(true);
  const [devName, setDevName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLocalhost(["localhost", "127.0.0.1"].includes(window.location.hostname));
  }, []);

  useEffect(() => {
    if (isLocalhost || !widgetRef.current) return;

    window.onFarmlyTelegramAuth = async (user) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/telegram/verify-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Login failed");
        const session: BuyerSession = data;
        setBuyerSession(session);
        onLoggedIn(session);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed");
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", "onFarmlyTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;
    widgetRef.current.appendChild(script);
  }, [isLocalhost, onLoggedIn]);

  async function handleDevLogin() {
    if (!devName.trim()) {
      setError("Enter a name first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/telegram/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: devName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      const session: BuyerSession = data;
      setBuyerSession(session);
      onLoggedIn(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!isLocalhost && (
        <div ref={widgetRef} className="mb-3 flex justify-center" />
      )}

      {isLocalhost && (
        <div className="mb-3 rounded-xl border border-line bg-surface-sunk p-3">
          <p className="mb-2 text-[10.5px] text-ink-faint">
            The real Telegram Login widget only works on the deployed domain (registered via
            @BotFather). For local dev, use a test login:
          </p>
          <input
            value={devName}
            onChange={(e) => setDevName(e.target.value)}
            placeholder="Your name"
            className="mb-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px]"
          />
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full rounded-lg bg-[#229ED9] py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
          >
            {loading ? "Logging in…" : "✈️ Use test login (dev)"}
          </button>
        </div>
      )}

      {error && <p className="mb-2 text-[11px] text-coral-600">{error}</p>}
    </div>
  );
}
