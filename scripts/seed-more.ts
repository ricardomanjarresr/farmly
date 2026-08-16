import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const placeholder = (label: string) => `https://placehold.co/400x500?text=${encodeURIComponent(label)}`;

async function main() {
  const blueSky = await prisma.farm.upsert({
    where: { telegramChatId: "seed-blue-sky" },
    update: {},
    create: {
      name: "Blue Sky Orchard",
      town: "Millbrook",
      telegramChatId: "seed-blue-sky",
      lat: 42.148,
      lng: -72.52,
      shippingMode: "flat_fee",
      flatFeeAmount: 3.5,
      flatFeeRadiusKm: 25,
    },
  });

  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  const hoursFromNow = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

  const honey = await prisma.listing.create({
    data: {
      farmId: blueSky.id,
      item: "Raw wildflower honey",
      category: "eggs & dairy",
      price: 9.0,
      unit: "jar",
      qtyAvailable: 18,
      expiresAt: daysFromNow(60),
      photoUrl: placeholder("Honey"),
    },
  });

  const corn = await prisma.listing.create({
    data: {
      farmId: blueSky.id,
      item: "Sweet corn",
      category: "vegetable",
      price: 0.75,
      unit: "ea",
      qtyAvailable: 6,
      expiresAt: daysFromNow(3),
      photoUrl: placeholder("Corn"),
    },
  });

  // A second pooled listing, still "open" (not yet reached) - so the
  // in-progress progress bar and post-checkout WhatsApp share button
  // are both testable, alongside the other listing that's already "reached".
  const sunrise = await prisma.farm.findUnique({ where: { telegramChatId: "seed-sunrise-acres" } });
  if (sunrise) {
    await prisma.farm.update({
      where: { id: sunrise.id },
      data: { shippingMode: "pooled", poolThresholdQty: 40, poolDeadlineHours: 48 },
    });
    const lettuce = await prisma.listing.findFirst({ where: { farmId: sunrise.id, item: "Butter lettuce" } });
    if (lettuce) {
      await prisma.shippingPool.upsert({
        where: { listingId: lettuce.id },
        update: {},
        create: { listingId: lettuce.id, targetQty: 40, currentQty: 14, deadline: hoursFromNow(36), status: "open" },
      });
    }
  }

  // Pre-existing orders so /pedidos has content without needing a live checkout first.
  const order1 = await prisma.order.create({
    data: { buyerName: "Ana Torres", buyerPhone: "(413) 555-0122", status: "pending" },
  });
  await prisma.orderLine.create({ data: { orderId: order1.id, listingId: honey.id, qty: 2, priceAgreed: 9.0 } });
  await prisma.listing.update({ where: { id: honey.id }, data: { qtyAvailable: { decrement: 2 } } });

  const order2 = await prisma.order.create({
    data: { buyerName: "Jorge Diaz", buyerPhone: "(413) 555-0199", status: "pending" },
  });
  await prisma.orderLine.create({ data: { orderId: order2.id, listingId: corn.id, qty: 3, priceAgreed: 0.75 } });
  await prisma.listing.update({ where: { id: corn.id }, data: { qtyAvailable: { decrement: 3 } } });

  console.log("Seeded Blue Sky Orchard (honey, corn), an open shipping pool on Sunrise Acres' lettuce, and 2 pending orders.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
