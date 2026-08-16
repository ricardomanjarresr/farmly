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
