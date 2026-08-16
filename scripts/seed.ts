import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const placeholder = (label: string) => `https://placehold.co/400x500?text=${encodeURIComponent(label)}`;

async function main() {
  const farms = [
    { name: "Rio Verde Farm", town: "Springfield", telegramChatId: "seed-rio-verde" },
    { name: "Sunrise Acres", town: "Springfield", telegramChatId: "seed-sunrise-acres" },
    { name: "Green Valley", town: "Millbrook", telegramChatId: "seed-green-valley" },
  ];

  const [rioVerde, sunrise, greenValley] = await Promise.all(
    farms.map((f) =>
      prisma.farm.upsert({
        where: { telegramChatId: f.telegramChatId },
        update: f,
        create: f,
      }),
    ),
  );

  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const listings = [
    { farmId: rioVerde.id, item: "Heirloom tomatoes", category: "vegetable", price: 3.5, unit: "lb", qtyAvailable: 40, expiresAt: daysFromNow(5) },
    { farmId: rioVerde.id, item: "Strawberries", category: "fruit", price: 4.25, unit: "pt", qtyAvailable: 15, expiresAt: daysFromNow(1) },
    { farmId: sunrise.id, item: "Butter lettuce", category: "vegetable", price: 2.0, unit: "head", qtyAvailable: 20, expiresAt: daysFromNow(4) },
    { farmId: sunrise.id, item: "Carrots", category: "vegetable", price: 2.75, unit: "lb", qtyAvailable: 30, expiresAt: daysFromNow(6) },
    { farmId: greenValley.id, item: "Pasture-raised eggs", category: "eggs & dairy", price: 6.0, unit: "doz", qtyAvailable: 12, expiresAt: daysFromNow(10) },
  ];

  for (const l of listings) {
    await prisma.listing.create({ data: { ...l, photoUrl: placeholder(l.item) } });
  }

  const referencePrices = [
    { item: "Heirloom tomatoes", source: "Whole Foods", price: 5.5 },
    { item: "Heirloom tomatoes", source: "Walmart", price: 4.2 },
    { item: "Strawberries", source: "Whole Foods", price: 6.0 },
    { item: "Butter lettuce", source: "Whole Foods", price: 3.0 },
    { item: "Carrots", source: "Walmart", price: 3.5 },
    { item: "Pasture-raised eggs", source: "Whole Foods", price: 7.5 },
  ];

  for (const rp of referencePrices) {
    await prisma.referencePrice.create({ data: rp });
  }

  console.log(`Seeded ${farms.length} farms, ${listings.length} listings, ${referencePrices.length} reference prices.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
