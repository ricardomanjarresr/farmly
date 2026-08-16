import { getEffectivePrice } from "../src/lib/pricing";

const now = new Date("2026-08-16T12:00:00Z");
console.log("no expiry:", getEffectivePrice(4.0, null, now));
console.log("in 5 days:", getEffectivePrice(4.0, new Date("2026-08-21T12:00:00Z"), now));
console.log("in 2 days:", getEffectivePrice(4.0, new Date("2026-08-18T12:00:00Z"), now));
console.log("in 1 day:", getEffectivePrice(4.0, new Date("2026-08-17T12:00:00Z"), now));
console.log("today:", getEffectivePrice(4.0, new Date("2026-08-16T18:00:00Z"), now));
console.log("expired:", getEffectivePrice(4.0, new Date("2026-08-15T12:00:00Z"), now));
