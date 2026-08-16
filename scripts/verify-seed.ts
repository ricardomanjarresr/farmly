import { prisma } from "../src/lib/prisma";
import { getEffectivePrice } from "../src/lib/pricing";

async function main() {
  const listings = await prisma.listing.findMany({ where: { status: "active" }, include: { farm: true } });
  for (const l of listings) {
    const p = getEffectivePrice(l.price, l.expiresAt);
    console.log(
      l.item, "-", l.farm.name, "- base", l.price, "- effective", p.effectivePrice,
      p.isMarkedDown ? `(${p.percentOff}% off)` : "",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
