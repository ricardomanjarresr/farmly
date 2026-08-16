import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const placeholder = (label: string) => `https://placehold.co/400x500?text=${encodeURIComponent(label)}`;

async function main() {
  const farms = [
    {
      name: "Rio Verde Farm",
      town: "Springfield",
      telegramChatId: "seed-rio-verde",
      lat: 42.1015,
      lng: -72.5898,
      shippingMode: "pooled",
      poolThresholdQty: 50,
      poolDeadlineHours: 48,
    },
    {
      name: "Sunrise Acres",
      town: "Springfield",
      telegramChatId: "seed-sunrise-acres",
      lat: 42.1091,
      lng: -72.6015,
      shippingMode: "free_above_min",
      freeShippingMinAmount: 25,
    },
    {
      name: "Green Valley",
      town: "Millbrook",
      telegramChatId: "seed-green-valley",
      lat: 42.155,
      lng: -72.512,
      shippingMode: "flat_fee",
      flatFeeAmount: 4.5,
      flatFeeRadiusKm: 30,
    },
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
  const hoursFromNow = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

  const listings = [
    { farmId: rioVerde.id, item: "Heirloom tomatoes", category: "vegetable", price: 3.5, unit: "lb", qtyAvailable: 40, expiresAt: daysFromNow(5) },
    { farmId: rioVerde.id, item: "Strawberries", category: "fruit", price: 4.25, unit: "pt", qtyAvailable: 15, expiresAt: daysFromNow(1) },
    { farmId: sunrise.id, item: "Butter lettuce", category: "vegetable", price: 2.0, unit: "head", qtyAvailable: 20, expiresAt: daysFromNow(4) },
    { farmId: sunrise.id, item: "Carrots", category: "vegetable", price: 2.75, unit: "lb", qtyAvailable: 30, expiresAt: daysFromNow(6) },
    { farmId: greenValley.id, item: "Pasture-raised eggs", category: "eggs & dairy", price: 6.0, unit: "doz", qtyAvailable: 12, expiresAt: daysFromNow(10) },
  ];

  const created = [];
  for (const l of listings) {
    created.push(await prisma.listing.create({ data: { ...l, photoUrl: placeholder(l.item) } }));
  }

  // Pre-seeded pool already at threshold (decision #16: real deadlines are too
  // slow to demo live, so one listing ships already in the "reached" state).
  const pooledListing = created[0]; // Heirloom tomatoes, Rio Verde Farm (pooled mode)
  await prisma.shippingPool.create({
    data: {
      listingId: pooledListing.id,
      targetQty: 50,
      currentQty: 52,
      deadline: hoursFromNow(20),
      status: "reached",
    },
  });

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

  console.log(
    `Seeded ${farms.length} farms, ${listings.length} listings, 1 shipping pool (reached), ${referencePrices.length} reference prices.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
