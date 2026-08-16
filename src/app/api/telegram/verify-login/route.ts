import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies a Telegram Login Widget callback per Telegram's spec:
 * https://core.telegram.org/widgets/login#checking-authorization
 *
 * Real, non-simulated auth (decision #20) - but the widget only works on a
 * domain registered with @BotFather (/setdomain), which localhost isn't. Use
 * this route once deployed; local dev falls back to the dev-login route.
 */
type TelegramAuthData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  const data = (await req.json()) as TelegramAuthData;
  const { hash, ...rest } = data;

  if (!hash) {
    return NextResponse.json({ error: "Missing hash" }, { status: 400 });
  }

  const checkString = Object.entries(rest)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHash("sha256").update(token).digest();
  const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  const valid =
    computedHash.length === hash.length &&
    timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - data.auth_date;
  if (ageSeconds > MAX_AUTH_AGE_SECONDS) {
    return NextResponse.json({ error: "Login expired, try again" }, { status: 401 });
  }

  return NextResponse.json({
    telegramId: String(data.id),
    name: [data.first_name, data.last_name].filter(Boolean).join(" "),
    username: data.username,
    photoUrl: data.photo_url,
  });
}
