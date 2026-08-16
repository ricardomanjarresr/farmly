import { prisma } from "../src/lib/prisma";

async function main() {
  const listings = await prisma.listing.findMany({ take: 2 });
  if (listings.length < 2) throw new Error("Run seed.ts first");

  const order = await prisma.order.create({
    data: {
      buyerName: "Test Buyer",
      buyerPhone: "555-0100",
      status: "pending",
      lines: {
        create: [
          { listingId: listings[0].id, qty: 2, priceAgreed: listings[0].price },
          { listingId: listings[1].id, qty: 1, priceAgreed: listings[1].price },
        ],
      },
    },
    include: { lines: { include: { listing: true } } },
  });
  console.log(`Order ${order.id} with ${order.lines.length} lines:`);
  order.lines.forEach((l) => console.log(` - ${l.qty}x ${l.listing.item} @ $${l.priceAgreed}`));

  const pool = await prisma.shippingPool.findFirst({ include: { listing: { include: { farm: true } } } });
  console.log(`\nShipping pool: ${pool?.listing.item} - ${pool?.currentQty}/${pool?.targetQty} - status: ${pool?.status}`);

  await prisma.orderLine.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
