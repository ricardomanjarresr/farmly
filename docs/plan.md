# Farmly / El Farmer — Planning Discussion

## ⭐ FINAL DIRECTION (2026-08-16, night) — supersedes everything below

Conflict resolved: Ricardo logged a separate "team decision" (`docs/decisions.md`) explicitly cutting B2B, the Negotiation Agent, and the Aggregation Agent — the opposite of what Walmy had told me earlier tonight. Walmy's call: **adopt Ricardo's plan as the base, and add price comparison on top.** Everything about Version B, B2B, Premium tiers, Negotiation Agent, and Aggregation Agent in the sections below is now **out of scope** — kept in this file only as a record of how we got here, not as something to build.

### The adopted flow (Ricardo's `docs/flow_draft.html` + `docs/decisions.md`)

1. **Farmer posts on Telegram** — photo + voice/text: item, price, quantity, expiration. (AI extraction still deferred until an Anthropic key exists; typed-only for now.)
2. **Listing appears on a web discovery feed** — grid layout, newest-first, no algorithm.
3. **Buyer browses freely, no account** — search bar, category chips (All / Vegetables / Fruit / Eggs & dairy / Near me), like + save on every card.
4. **Buyer taps Buy — entirely on the web** — quantity stepper, name, phone, confirm. No redirect to Telegram. Simulated confirmation, no real charge (matches what we'd already decided).
5. **Farmer manages everything inside Telegram** — `/mislistings` (see own listings, reply `DELETE n` to remove), `/pedidos` (see incoming orders). No farmer web login/dashboard.
6. **Full social feed features are in scope**: like, comment, follow farmer, search/filter. If time runs short, cut in this order: comments first, then follow — like, save, and search/filter are protected.
7. **Buyer's price field**: no separate price filter at all in Ricardo's flow — dropped along with the B2B/negotiation scope, so the earlier "floor filter vs. max budget" question is now moot.

### What Walmy is adding on top: price comparison

The one piece of Walmy's spec that carries forward: show the Farmly price next to Whole Foods/Amazon/Walmart for the same product, using mocked/hand-entered reference data (not live-scraped) — this stays in scope, layered onto Ricardo's flow rather than replacing it.
- **On the feed card**: a small badge when a `ReferencePrice` exists for that item (e.g. "23% less than store") — reinforces the discovery/"grass-planting" feel Rednote-style feeds rely on, right where the buyer is already browsing.
- **In the Buy modal**: a one-line comparison ("Farmly $3.50/lb · Whole Foods $5.50/lb") alongside the confirm button, for the moment it matters most for conversion.

### Updated data model (Prisma) — replaces the Version B model below

- `Farm` — id, name, town, telegram_chat_id (to know who to notify)
- `Listing` — id, farm_id, item, price, unit, qty_available, expiration_date, photo_url, category (vegetable/fruit/eggs & dairy/etc., for the chip filter), like_count, status (active/deleted), created_at (drives newest-first sort)
- `Order` — id, listing_id, buyer_name, buyer_phone, qty, status (pending/confirmed — simulated), created_at
- `ReferencePrice` — id, item, source (Whole Foods/Amazon/Walmart), price — small hand-entered table for the demo

No `OrderLine`, no `tier`/`floor_price`, no `buyer_type` — those were all B2B/negotiation/premium fields, now dropped. `Comment` and `Follow` are not modeled yet since they're the first two things to cut if time is short — add only if the core loop is done early.

### Branch split — assigned

Adapted from Ricardo's 4-way proposal into a 2-person split, both branching from the same merged base (`main` — app scaffold + Ricardo's docs, already merged and pushed):

- **`feature/telegram-farmer-backend` — Walmy.** Prisma schema (`Farm`, `Listing`, `Order`, `ReferencePrice`), Telegram bot (`/sell`, `/mislistings`, `/pedidos`), Listing Extraction Agent (blocked on Anthropic key).
- **`feature/web-buyer-experience` — Ricardo.** Discovery feed (grid, search, chips, like/save, price-comparison badge), Buy flow (qty/name/phone/confirm, price-comparison line, writes to `Order`).

Both branches are pushed and ready to build on. Since the schema lives on Walmy's branch, Ricardo's branch will need it merged in (or the schema shape agreed on up front) before `feed-web`/`buy-flow` can read real data — worth syncing on the `Listing`/`Order`/`ReferencePrice` shape early rather than at merge time.

### Markdown pricing near expiry (new, added while building)

A listing's price now auto-discounts as `expiresAt` approaches, reusing the field already in the schema — no new data needed. Schedule: 15% off at 2 days to expiry, 30% off at 1 day or today. Expired listings are flagged and excluded from feed queries rather than shown at a discount. Implemented as a shared, pure function (`src/lib/pricing.ts`, `getEffectivePrice(basePrice, expiresAt)`) so both branches compute it the same way: the feed shows the discounted price plus a badge, the buy flow charges the effective (discounted) price, and `feed-web`'s listing query should filter out anything past its `expiresAt`.

### Still blocked on

- Telegram bot token (@BotFather) — needed for `telegram-bot` and to test `buy-flow`'s farmer-notification path end-to-end.
- Anthropic API key — needed for photo→listing extraction; everything else (typed listing entry, feed, buy flow, price comparison) doesn't need it.

## Context (older material below, superseded by the section above)

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

## Pivot: building for Version B (Walmy's decision)

Walmy has decided to build toward the **full "El Farmer" vision (Version B)**, not the narrower wedge. The analysis above stays as context for *why* that's the harder path — the sections below replace the earlier "middle path" recommendation with a plan for actually building all four agent roles from Ricardo's README in one day.

### What "Version B" means to build

1. **Listing Extraction Agent** — farmer sends a photo and/or text; AI extracts product, price, quantity, expiration, delivery method into a structured listing. (Previously the optional "wow moment" — now a required feature.)
2. **Matching Agent** — buyer describes what they want in natural language ("necesito 2kg de tomate para mañana"); agent searches the live catalog and returns matches at the farmer's listed price. This is the **Free tier** behavior.
3. **Negotiation Agent (Premium)** — for farmers who opt into Premium, buyer offers get countered within a floor price the farmer set once. Reserving becomes "reserve at a negotiated price" instead of "reserve at listed price."
4. **Aggregation Agent (Premium)** — when a B2B buyer needs more of a product than any single farmer has, the agent stitches together listings from multiple farmers (same product, compatible pickup windows) into one consolidated order with a single confirmation.
5. **Freemium framing** — a farmer's listing is tagged Free or Premium; Premium unlocks #3 and #4 for that farmer. No real billing — this is a flag on the listing for the demo narrative, consistent with "mock payment entirely."

### Decisions from planning session 2026-08-16 (evening) — "Farmly" full spec

Name is confirmed: **Farmly**. Walmy laid out the full three-sided model: Farmer (producer, also a paying customer), Platform, Buyer (both B2C and B2B — not choosing one).

**Farmer tiers (confirmed):**
- **Free** — listed in the marketplace, can sell, no boosted visibility.
- **Premium** — "Agent Max" (full Negotiation + Aggregation Agent support) + "Recommended Seller" (boosted placement — premium listings surface first in match/search results, similar to sponsored placement on Amazon/MercadoLibre).

**Farmer listing flow (confirmed):** picture, voice, or text → name, expiration, minimum price (floor price), quantity → creates a listing in the backend. Also want a **companion website**, browsable "kind of like Amazon or MercadoLibre" — not just the pickup-sheet fallback previously planned, but a real browsable catalog. Telegram stays the primary interface (confirmed reason: easier access than WhatsApp, no business-account approval wait); the website is the secondary surface over the same backend/data.

**Buyer request flow (confirmed fields):** product, quantity, a price threshold, location. System searches/matches against the listing database on those fields.

**Payment (new — changes prior scope):** wants a real payment confirmation step, Stripe if feasible, "or simpler than that if possible." This is a change from the earlier plan's "mock payment entirely" — see recommendation below.

**Nice-to-have #4 (not core scope):** price-comparison feature — show the Farmly price next to Whole Foods/Amazon/Walmart for the same organic product, so buyers can see the savings. Real-time competitor pricing isn't feasible to pull live in a day-build; if built at all, this would use a small static/mocked comparison table for a few demo products, purely for the pitch narrative.

**Fulfillment framing (clarified, not changed in scope):** the pitch value prop is "buyers don't have to go to the Sunday market or Walmart, they get it when they need it" and "farmers don't have to show up to Sunday market every time." This is framing, not a commitment to build delivery logistics — the platform still doesn't run delivery. The bot/website can say "pick up, or arrange delivery directly with the farmer," keeping the actual engineering scope to matching + reservation, consistent with the research doc's warning that owning logistics is what killed TaniHub/Otipy.

**My recommendation on B2C vs. B2B (asked for directly):** build both — they're both already in the data model (`buyer_type` on `Order`) — but **lead the demo with the B2B/Aggregation Agent flow** (a business buyer needs more of a product than one farm has, the agent consolidates across farms) as the headline "wow" moment, with the individual/B2C `/browse` flow as the second, "also works for a household" beat. Reasoning: B2B aggregation is the more differentiated, more Frubana-like value prop and the harder problem to solve, so it's the stronger demo story; B2C browsing is simpler and serves as a good warm-up / breadth-of-market signal before the bigger moment. Don't cut either — sequence them.

**Open questions — resolved:**
1. **Buyer's "minimum price" = a floor filter.** The buyer is screening out listings priced suspiciously/undesirably cheap, not capping their budget. Matching logic: exclude listings priced *below* the buyer's stated threshold (opposite of a max-budget cap).
2. **Payment = simulated confirm for today's demo.** "Confirm" is a commitment step with no real charge — no Stripe account/webhook work needed today. Real Stripe test-mode Checkout stays a stretch add-on only if time allows.
3. **Price-comparison feature = in scope, with mocked data.** Small static comparison table (Farmly price vs. Whole Foods/Amazon/Walmart) for a couple of demo products, shown at confirm time or on the listing — purely for the pitch narrative, not live-scraped.

### B2C Discovery Feed — "Rednote for vegetables" (new, evening session)

Walmy's new addition, scoped specifically to **B2C** (not B2B): a visual, browse-to-discover feed for individual buyers, modeled on Xiaohongshu/Rednote's paradigm — a scrollable feed of photo-forward cards (produce photo + short caption: item, price, farm/story) that a buyer discovers by scrolling, rather than a request-driven search where they have to already know what they want.

**How this fits alongside what's already planned, not replacing it:**
- `/browse` (Matching Agent) stays as the **intent-driven** path: buyer already knows what they want, states it, gets a direct match.
- The new **discovery feed** is the **browsing/inspiration** path: buyer doesn't start with a specific ask, they scroll a feed of what's currently available and see something they want. This is the more Rednote-like behavior — discovery before intent.
- Natural home for this is the **companion website** (already planned as "browsable like Amazon/MercadoLibre") — a Telegram bot can't really do infinite-scroll, but it can send a short "today's picks" digest (a handful of photo cards) as a lightweight taste of the same discovery feel inside the chat.
- No new data model needed — the feed is a different *presentation* over the existing `Listing` table (photo_url, item, price, farm/town), not a new entity. Sort/filter for the feed: most recent listings first, Premium/"Recommended Seller" listings boosted toward the top — reusing the same tier logic already in the plan rather than inventing a second ranking system.
- **Depends on listings actually having photos to look like a real feed.** Since photo capture via the Listing Extraction Agent is deferred (no Anthropic key yet), the feed will look sparse/empty until either that AI feature lands, or demo listings are seeded with placeholder produce photos (a stock photo per demo product is enough to make the feed look real for a walkthrough — doesn't require the AI extraction to be working).
- Optional stretch, not core: lightweight "save"/like interaction per card for a more social feel — skip for today's build unless everything else is done early.

**Where this sits in priority:** this is additive to the B2C flow, not a replacement for `/browse` — keep the earlier sequencing recommendation (B2B/Aggregation Agent as the headline demo moment, B2C as the second beat), and treat the discovery feed as *part of* that B2C beat — "here's how a household discovers what's available" — rather than a third, separate thing to demo.

### Decisions from planning session 2026-08-16 (afternoon)

- **AI features deferred until an Anthropic API key exists.** No photo→listing extraction yet, no LLM-narrated chat replies yet. Everything else builds now using plain typed input and plain templated bot text. This is a bigger simplification than it sounds: the Negotiation and Aggregation Agents were already planned as deterministic math (see option (b) below) — the only thing AI was adding on top was making the chat text *sound* like an agent talking. Without a key, the bot just states the outcome directly ("Counter-offer: $X — accept? [yes/no]" instead of an LLM-phrased negotiation message). Fully functional, just plainer language. The photo-extraction feature (farmer sends a photo, AI reads it) is the one piece that has no non-AI substitute — it's simply on hold until a key is available, and `/sell` works as a typed-only flow until then.
- **Telegram bot token**: not ready yet, deferred. Bot skeleton/webhook code can still be written and unit-tested, but nothing can be tested end-to-end inside actual Telegram until the token exists.
- **Demo data (farms/products)**: not decided yet, deferred. Schema and seed-script structure can be built now; actual farm names/products get decided later.
- **Net effect on build order**: steps that don't depend on the API key or the bot token (Prisma schema, negotiation math, aggregation math, pickup sheet logic) can proceed now. Steps that need the bot token (anything tested live in Telegram) and the API key (photo extraction, LLM narration) are blocked until Walmy provides them.

### The implementation decision that determines whether this is finishable in a day

"AI agent negotiates" and "AI agent aggregates" can mean two very different builds:

- **(a) True LLM-orchestrated agents** — an LLM actually reasons through the negotiation or aggregation live (tool-calling, multi-step reasoning). Closest to the literal pitch, but high risk: harder to make reliably correct, harder to debug, more that can go wrong live in front of judges.
- **(b) Deterministic logic with an AI-narrated voice (recommended)** — the actual counter-offer math (bounded by the floor price) and the aggregation matching (greedy sum across listings until the requested quantity is met) are plain, predictable code — but the bot narrates the outcome via an LLM call, so the chat transcript still *reads* like an agent negotiating/aggregating. Safer, faster, and leaves real build time for the Listing Extraction Agent — the hardest and most novel piece, and the one most worth protecting time for.

Going with **(b)** for the day-build. Full agent orchestration (a) is a legitimate stretch goal only if 1–4 above are working solidly with time to spare.

### B2B buyer segment (needed for Aggregation to mean anything)

Aggregation only demonstrates something if a buyer asks for more than one farmer can supply. Adding: a buyer-type distinction (individual vs. business) captured on first contact with the bot, and a `/order` flow (separate from casual `/browse`) for a business buyer to request a quantity that may span multiple farms.

### Updated data model (Prisma)

- `Farm` — id, name, town, pickup_location, pickup_time
- `Listing` — id, farm_id, item, unit, price, qty_available, week_of, photo_url, tier (free/premium), floor_price (nullable, premium only), expiration_date
- `Order` — id, buyer_name, buyer_type (individual/business), status (pending/confirmed — "confirmed" is the simulated-payment state, no real charge), created_at
- `OrderLine` — id, order_id, listing_id, qty_reserved, price_agreed
- `ReferencePrice` (new, for the price-comparison nice-to-have) — id, item, source (e.g. "Whole Foods"/"Amazon"/"Walmart"), price — a small hand-entered/mocked table, not live-scraped, joined against `Listing.item` at demo time to show the savings.

(`Order`/`OrderLine` replaces the earlier single `Order` table — a business buyer's aggregated order can now span multiple listings across different farms, so one `Order` needs many `OrderLine`s.)

**Buyer's price threshold is a floor filter**, not a max budget: when matching, exclude listings priced *below* what the buyer stated (screens out suspiciously cheap listings), not above it.

### Updated bot flows

1. `/sell` — farmer flow: item/unit/price/qty/pickup info (with optional photo → Listing Extraction Agent), plus a new "free or premium?" step, and a floor price if premium.
2. `/browse` — individual buyer flow: Matching Agent, direct match at listed price (free-tier behavior).
3. `/order` — business buyer flow: buyer states product + quantity in natural language; if one farmer's listing covers it, confirm directly; if not, and enough listings together cover it, the Aggregation Agent proposes a consolidated order across farms.
4. Negotiation — inside `/browse` or `/order`, if the matched listing is premium, the bot invites a counter-offer and returns a counter bounded by the farmer's floor price.
5. Confirm — before finalizing, the bot shows a simulated "confirm to reserve" step (no real charge) and, if a `ReferencePrice` exists for that item, a one-line price comparison ("Farmly: $3/lb · Whole Foods: $5.50/lb").
6. `/mysheet` — farmer pickup sheet, now built from `OrderLine`s so it correctly reflects both direct and aggregated orders.
7. **Discovery feed (website, B2C)** — photo-forward scrollable feed of current listings, most-recent-first with Premium listings boosted; optional lightweight "today's picks" digest sent via the bot as a taste of the same discovery feel in chat.

### Still explicitly out of scope

- Real payment or delivery/logistics — "reserve"/"confirm" is a commitment, not a paid transaction.
- Reputation/credit engine — Ricardo's own doc names this as a future business line, not a hackathon build.
- Real subscription billing for Premium — a flag on a listing, not a live payment flow.
- Full LLM-orchestrated agent reasoning (option (a) above) — deferred unless there's time left after the core build works.

### Build order (revised — hardest/most novel piece first, while the day is fresh)

1. Prisma schema (`Farm`, `Listing`, `Order`, `OrderLine`) — SQLite locally.
2. Telegram bot skeleton + `/sell` (text-only first).
3. Photo → Listing Extraction Agent — build and test this early; it's the biggest risk and the true novelty, not something to leave for the end.
4. `/browse` — Matching Agent, free-tier direct match.
5. Negotiation logic (deterministic + LLM narration) for premium listings.
6. `/order` + Aggregation Agent (deterministic greedy match + LLM narration).
7. `/mysheet` pickup sheet across `Order`/`OrderLine`, plus companion web page.
8. Discovery feed on the companion website (photo-forward, Premium-boosted) — seed demo listings with placeholder produce photos so it looks real even before AI photo extraction exists.
9. Commit, push (only once Walmy confirms — nothing pushed automatically).
10. Provision hosted Postgres, deploy to Vercel, wire up the Telegram webhook, smoke-test live.

### Verification (expanded)

- Local: farmer posts both a free and a premium listing (with photo); an individual buyer browses and reserves at listed price; an individual buyer negotiates a premium listing toward (but not below) the floor price; a business buyer requests more than any single farmer has and confirms an order aggregated across 2+ farms; the pickup sheet reflects everything correctly; over-reserving is still rejected.
- Deployed: repeat the same walkthrough against the live bot before calling it demo-ready.

## Earlier "middle path" recommendation (superseded by the Version B pivot above, kept for context)

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
