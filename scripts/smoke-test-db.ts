import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const farm = await prisma.farm.create({
    data: { name: "Rio Verde Farm", town: "Demo Town", telegramChatId: "test123" },
  });
  const listing = await prisma.listing.create({
    data: { farmId: farm.id, item: "Tomatoes", category: "vegetable", price: 3.5, unit: "lb", qtyAvailable: 40 },
  });
  const refPrice = await prisma.referencePrice.create({
    data: { item: "Tomatoes", source: "Whole Foods", price: 5.5 },
  });
  const listings = await prisma.listing.findMany({ include: { farm: true } });
  console.log(JSON.stringify(listings, null, 2));
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.referencePrice.delete({ where: { id: refPrice.id } });
  await prisma.farm.delete({ where: { id: farm.id } });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
