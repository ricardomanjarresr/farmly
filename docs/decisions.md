# Farmly — Confirmed Decisions

Answered by the team live, in order asked. Only resolved questions are logged here — see `docs/flow_draft.html` for the visual mockup these decisions produced, and `docs/plan.md` for Walmy's separate planning thread. Anything not listed here (e.g. buyer price field: max vs. floor; API key / Telegram token status) is still open.

## 1. Judging priority

**Q: What matters more for scoring — a smaller feature set that works live, or a bigger, more ambitious pitch even if some of it isn't fully working?**

A: Balance of both — one or two features fully working live (the "wow" moment), everything else clearly framed as roadmap/vision in the pitch narrative.

## 2. Product direction — Red Note pivot

The team pivoted the product to a Red Note (Xiaohongshu)–style discovery feed for produce: farmer side stays similar (post via Telegram), but the buyer side becomes a visual discovery feed rather than a chat-based request/match flow.

## 3. Buyer interface

**Q: Does the buyer use a visual feed app/web page to discover products (like Instagram/TikTok), instead of requesting by chat?**

A: Feed visual tipo app/web — a web feed, not chat-based requests.

## 4. B2B and negotiation

**Q: With the Discovery/B2C pivot, do the Aggregation Agent (multi-farmer B2B orders) and Negotiation Agent (price haggling) stay in scope?**

A: Out of scope — B2C discovery + direct purchase only. Buyer sees a post, buys at the price the farmer set. No negotiation, no B2B, no multi-farmer aggregation.

## 5. Farmer posting

**Q: Does the farmer post only via Telegram (photo + voice/text), with no direct use of the web/app?**

A: Yes, farmer posts only via Telegram — but also needs access to see/delete their own listings and check order status.

## 6. Farmer management panel

**Q: Is farmer listing/order management also inside Telegram (commands), or does it need a separate web login/dashboard?**

A: All inside Telegram via commands (e.g. `/mislistings`, `/pedidos`) — no login, no separate dashboard.

## 7. Buyer login

**Q: Does the buyer need an account to browse/buy, or can they explore and purchase without registering?**

A: No account — buyer browses freely; only gives name/contact info at the moment of purchase.

## 8. Discovery/social feature level

**Q: How "social/discovery" does the feed need to feel — how much of likes, comments, saves, following farmers, search/filter do we build?**

A: Full feed: like, comment, follow farmer, search/filter.

## 9. Cut order if time runs short

**Q: Given the full feed is ambitious for the time available, what gets cut first if needed?**

A: Cut comments first, then "follow farmer." Like, save, and search/filter are protected.

## 10. Buy flow

**Q: When a buyer taps "Buy" on a feed post, what happens — completed entirely on the web, or does it redirect to Telegram?**

A: Entirely on the web — quantity, name/contact, and confirmation all happen on the page. No redirect to Telegram. Order is written to the shared database; the farmer sees it via `/pedidos` in Telegram.

## 11. API key / bot token availability

**Q: Do we currently have an Anthropic API key and a Telegram bot token?**

A: Neither is available yet.

## 12. Next step before going technical

The team asked for a visual draft/mockup of the full flow first, to confirm as a group before moving into technical build — and wants the technical build split across the team using GitHub branches once confirmed. (See `docs/flow_draft.html` for that draft, published for team review.)

## 13. Buyer card sizing (feedback on flow_draft mockup)

**Feedback: all feed cards must be the same size** — the RED-style masonry (variable card heights) was replaced with a uniform grid (fixed-height photo, fixed-height card) in `docs/mockup_flows.html`.

## 14. Login method — phone + SMS OTP (simulated)

**Q: Is phone number + SMS verification code feasible, and is it free for the low volume of a hackathon demo?**

A: Yes, several providers work for free at this volume (Firebase test numbers, Twilio/Vonage trial credit), but all add real build time and external accounts. For today: **simulated** — buyer enters name + phone, a 6-digit code is shown/auto-filled, no real SMS provider integrated. Replaces the earlier "simulated Google login" decision (#7 revision). Real SMS (Firebase or Twilio) is a stretch goal only if time remains.

## 15. Shipping — farmer configures once, 3 modes

The farmer is asked about shipping **once, on their first Telegram listing** — not per-listing. Three modes, **all three built for the demo** (not simplified):

- **Mode 1 — Free above a minimum.** Farmer sets a minimum purchase amount or weight; orders below that minimum aren't allowed (not a shipping fee — a hard purchase minimum).
- **Mode 2 — Flat fee.** Charged to the buyer if under a threshold, or always, within a 30km max delivery radius. Team's own note: **not the recommended mode**, built for completeness.
- **Mode 3 — Aggregated/pooled shipping (the demo's "wow" feature).** When enough buyers (within 30km of the farmer) order the same product to reach a farmer-configured weight/amount threshold before a farmer-configured deadline, the farmer dispatches free to everyone in the pool.

## 16. Aggregated shipping — gamification and edge cases

- **Progress bar** on the feed card and product detail shows progress toward the pooled threshold, with a deadline countdown.
- **Threshold reached:** the listing stays visible in the feed (does not close) with the bar full and an "Envío gratis asegurado" banner — it keeps accepting new orders, and every buyer who joins after threshold is also guaranteed free shipping.
- **Deadline passes without reaching threshold:** the buyer is notified and asked to confirm they accept paying the flat fee (mode 2's fee) to proceed with their order; if they don't respond in time, the order auto-cancels.
- **Geolocation for the 30km check:** buyer's browser geolocation permission by default; if denied/unavailable, fall back to an address search (geocoded, e.g. via a free service like OpenStreetMap/Nominatim). Farmer sets an approximate location once via Telegram.
- **Demo timing:** real deadlines can be hours/days — too slow to demo live. For today, we pre-seed one listing already in the "threshold reached" state to show that outcome without waiting on a live timer.

## 17. App language

**Correction:** the mockup was drifting into Spanish (matching the conversation) but the app itself must be **English**, matching the earlier default decision. `docs/mockup_flows.html` has been rewritten fully in English.

## 18. Per-seller cart + free-shipping upsell (MercadoLibre-style)

**Q: After adding a product, should the buyer immediately see a carousel of more products from the same seller — "add $X more to unlock free shipping" — to grow the cart?**

A: Yes — this changes the buy flow from "confirm one item immediately" to a **real per-seller cart**:

- Tapping a product's CTA now says **"Add to cart"**, not "Buy" — it doesn't confirm an order yet.
- A cart screen appears showing what's in the cart so far, an upsell banner ("Add $8.50 more to unlock free shipping from Rio Verde Farm"), and a horizontal carousel of other items from that same farm with one-tap add buttons.
- The buyer can keep adding or tap **Checkout**, which is where the phone/SMS login (see #14) and final confirmation happen.
- The cart is scoped to **one seller at a time** — one checkout produces one `Order` with multiple `OrderLine`s, which already fits the shared `Order`/`OrderLine` schema in `docs/plan.md`. No backend schema change needed for this, just buyer-side flow.
- This upsell threshold is the natural home for shipping **Mode 1** (free above a minimum) from decision #15 — the cart shows live progress toward that minimum.

## 19. Share button on the group-shipping pool

**Q: Once a buyer joins a product's group-shipping "pool," should they get a share button (e.g. WhatsApp) to invite others and help reach the threshold faster?**

A: Yes. Added to the new **Order confirmed** screen (also fills the previously-missing "what happens right after checkout" gap):

- Appears **only** when the order is part of an active group-shipping pool (Mode 3) that hasn't hit its threshold yet — not shown on every order.
- Shows current pool progress (e.g. "You just joined the group — 32/50kg") plus a **"Share on WhatsApp"** button (pre-filled message + link) and a secondary generic share icon for the native OS share sheet (other apps).
- Not shown on Mode 1 or Mode 2 orders, or once a pool has already reached its threshold (at that point the messaging shifts to "free shipping secured," not a call to invite more people).
