# Farmly / El Farmer — Planning Discussion

## Context

There are **two different visions** for this project floating around, and they don't fully agree with each other. Before writing any code, we need to reconcile them and pick one scope for the day-build.

### Vision A — "Farmly" wedge (from local research doc, `AGENTS.md`/research synthesis)

A **narrow, low-tech tool**: a farmer posts what they have for sale this week, buyers reserve/claim quantities ahead of time, and the farmer gets an auto-tallied pickup list for Sunday market day — replacing a manual WhatsApp/text thread. No AI negotiation, no bots doing anything clever. The whole point is that it's *boring and small* on purpose, because the research turned up a long list of ag-marketplace startups (TaniHub, FarMart, Otipy, Agrofy) that died from cold-start problems, logistics costs, or being bypassed because chat already did the job.

### Vision B — "El Farmer" (already pushed to `github.com/ricardomanjarresr/farmly` by your teammate Ricardo)

A much bigger, more ambitious idea: a **chat-native AI agent marketplace** on Telegram/WhatsApp. Farmers send a photo + voice note, an AI agent turns that into a listing automatically. Buyers ask in plain language ("necesito 2kg de tomate para mañana") and a **Matching Agent** finds it. A **Negotiation Agent** haggles on the farmer's behalf. An **Aggregation Agent** stitches together listings from several nearby farmers to fill one big restaurant/store order no single farmer could supply alone. There's a freemium business model, and a long-term idea about using transaction history to eventually offer micro-credit/crop insurance.

### Why this is "the challenging idea" to talk through

Vision B is exciting and demo-friendly for hackathon judges ("agentic commerce" is a hot 2026 topic), but it is **much harder to build in a day**, especially with no prior experience:
- Photo/voice → structured listing needs a working vision+extraction AI pipeline, not just a form.
- "Negotiation Agent" means two AI agents actually bargaining — real logic, not just a button.
- "Aggregation Agent" means combining multiple farmers' listings into one order — real matching logic across records.
- All of this has to work live, in a chat interface (Telegram bot), not just a webpage.

Vision A is realistic for one day but is a much smaller, less flashy demo.

**A middle path exists:** build Vision A's real, working core (post → reserve → pickup sheet) as the reliable spine, and layer in *one* piece of Vision B's "wow" factor — most likely the photo-to-listing AI step, since that's the single most visually impressive and self-contained piece — without promising live agent-to-agent negotiation or multi-farmer aggregation (those can be "mocked"/simulated for the demo narrative rather than fully built).

## Recommended plan (synthesizing both docs)

**The call:** build Vision A's real, working core as the reliable spine, and layer in exactly **one** piece of Vision B's flash — photo → AI-extracted listing — since that's the single most self-contained, demoable AI moment and it directly matches the "novel moment" Ricardo's own README calls out as the hackathon-scope target. Everything else in Vision B (Negotiation Agent, Aggregation Agent, Telegram/WhatsApp bot layer, payment, logistics) gets explicitly deferred — and this isn't a compromise invented here, it's what Ricardo's README *itself* recommends under "Hackathon build scope": mock payment/logistics entirely, treat the Negotiation Agent as a stretch goal, and focus the two demo-worthy moments on listing extraction and (optionally) aggregation. We're taking that guidance and cutting it down further to what's realistic in one day with no prior build experience: just the extraction moment, not aggregation.

Why not the full agentic vision: the local research doc's failure-mode analysis (TaniHub, FarMart, Otipy, Agrofy — cold start, logistics cost, chat already being sufficient, trust requiring physical presence) applies just as hard to the AI-agent version as to a plain marketplace. Two AI agents negotiating and an aggregation engine stitching together multiple farmers' listings are real engineering problems, not UI problems — they'd eat the entire day and leave nothing reliable to demo.

### Interface: Telegram chat bot marketplace (per Walmy's direction)

Revised from the earlier draft: Walmy wants a **chat bot marketplace**, not a plain web page. This matches Ricardo's "chat-native" pitch — farmers and buyers interact entirely inside Telegram, no app install, no web form to visit.

What "marketplace" means here in scope: **multiple farms visible through one bot**, not just one farmer's list. A buyer messages the bot, sees what's currently available across participating farms in the demo town, and reserves from whichever listing they want. This is still Vision A's mechanic (post → reserve → pickup sheet) — just delivered as a chat marketplace instead of a single-farm web form, and still without the Negotiation/Aggregation Agents (deferred for the feasibility reasons above).

**Why Telegram over WhatsApp:** free Bot API, instant setup, no business-account verification wait — this is also what Ricardo's own README recommends for a hackathon timeline.

**How it fits the existing stack:** the bot doesn't need a separate server — Telegram webhooks can point at a Next.js API route (e.g. `/api/telegram/webhook`) hosted on the same Vercel deployment already being set up. Farmer and buyer conversations are just handled as bot commands/message flows in that route, backed by the same Prisma data model below.

### Geography/language

Keep it language-neutral for now: default UI copy in English, but keep strings short and swappable so it can be relabeled in Spanish later without restructuring anything. Don't block the build on this decision.

### Bot conversation flows (3 total, replacing web screens)

1. **Farmer flow** — `/sell` (or similar command) starts a guided conversation: item, unit, price, qty available, pickup day/time/location. Farmer can optionally **send a photo** of the produce instead of typing the item/price — the bot sends that photo to Claude's vision API to suggest item name/price/quantity, and asks the farmer to confirm or correct before saving. This is the one AI "wow" moment, self-contained and safe to fail gracefully (if extraction fails, the bot just falls back to asking the farmer to type it in — no broken flow).
2. **Buyer flow** — `/browse` (or similar) lists what's currently available across all participating farms, buyer picks an item and quantity by replying, bot confirms the reservation and asks for a name (phone number is already known from their Telegram account).
3. **Pickup sheet** — a farmer command (e.g. `/mysheet`) that returns the auto-tallied, sorted list of that farmer's reserved orders, ready for Sunday pickup. (A simple companion web page showing the same sheet is a cheap fallback to keep, in case Walmy wants something to project on a screen during the pitch rather than scrolling a phone.)

### Data model (Prisma)

- `Farm` — id, name, town, pickup_location, pickup_time
- `Listing` — id, farm_id, item, unit, price, qty_available, week_of, photo_url (nullable)
- `Order` — id, listing_id, buyer_name, buyer_phone, qty_reserved, status, created_at

Server-side constraint enforced in the order-creation logic: sum of `qty_reserved` per listing can never exceed `qty_available` (checked inside a DB transaction to avoid race conditions from two buyers reserving at once — this is the one piece of real logic worth being careful about).

### What's explicitly NOT built (and why, matching Ricardo's own hackathon-scope note)

- No Negotiation Agent (no AI bargaining) — rule-based/manual pricing only.
- No Aggregation Agent (no multi-farmer order-pooling) — one farmer, one listing sheet.
- No Telegram/WhatsApp bot — web page only.
- No real payment or delivery/logistics — "reserve" is a commitment, not a paid transaction; pickup is in-person, matching how Sunday markets already work.
- These are named as roadmap items in the demo narrative, not silently dropped — this mirrors exactly what Ricardo's README already says a hackathon should mock or skip.

### Stack (already in progress)

Next.js (App Router, used here mainly for the API route + optional pickup-sheet page) + TypeScript + Prisma, deployed on Vercel. GitHub repo `ricardomanjarresr/farmly` already has write access confirmed — the existing `README.md` and `docs/flywheel.html` stay untouched; the app gets added alongside them, not over them. For the bot itself: a Telegram bot library (e.g. `grammy` or `node-telegram-bot-api`) wired into a webhook API route. For the database: SQLite locally for fast iteration, switched to a hosted Postgres (Vercel Postgres or Neon via Vercel Marketplace) before the first deploy, since Vercel's serverless functions can't persist a SQLite file between requests, and the bot needs real persistence to be usable at all (conversation state, listings, reservations).

**New requirement this pivot introduces:** a Telegram bot token from @BotFather (Walmy creates the bot via Telegram, sends me the token — this is an account action only Walmy can do, a few minutes inside the Telegram app).

### Build order

1. Prisma schema + migration (Farm, Listing, Order) — SQLite locally.
2. Stand up the Telegram bot skeleton (webhook route, `/start` responds) — needs Walmy's bot token before this step can be tested end-to-end.
3. Farmer flow (`/sell`, text-only first — item/unit/price/qty/pickup info).
4. Buyer flow (`/browse`, reserve a quantity).
5. Pickup sheet command + optional companion web page.
6. Photo → AI listing extraction (the wow moment), wired into the farmer flow.
7. Commit, push to `ricardomanjarresr/farmly` (only once Walmy confirms — nothing gets pushed automatically).
8. Provision hosted Postgres, wire up production `DATABASE_URL` and Telegram webhook URL, deploy to Vercel, smoke-test the live bot.

### Verification

- Local: use a Telegram testing approach (e.g. `ngrok`/tunnel for the webhook, or long-polling mode during dev) — walk through the full loop by hand from an actual Telegram client: post a listing as a farmer (with and without photo), reserve as a buyer from a second Telegram account, confirm the pickup sheet reflects it, confirm over-reserving past `qty_available` is rejected.
- Deployed: repeat the same walkthrough against the live bot (webhook pointed at the deployed Vercel URL) before calling it demo-ready.
