import { NextRequest, NextResponse } from "next/server";

/**
 * Dev-only stand-in for the real Telegram Login Widget (verify-login/route.ts),
 * which requires a domain registered via @BotFather /setdomain - localhost
 * can't use it. Only reachable outside production so the demo build on the
 * real Vercel domain always uses the real widget.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  return NextResponse.json({
    telegramId: `dev-${Math.random().toString(36).slice(2, 10)}`,
    name: name.trim(),
    username: undefined,
    photoUrl: undefined,
  });
}
