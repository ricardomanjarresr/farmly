import { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import { parseSellMessage } from "./parse";

function requireToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

export function createBot() {
  const bot = new Bot(requireToken());

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Welcome to Farmly.\n\n" +
        "/setfarm Name, Town - set up your farm (do this first)\n" +
        "/sell item, price, unit, qty, expires - post a listing\n" +
        "/mislistings - see your active listings\n" +
        "/pedidos - see your orders",
    );
  });

  bot.command("setfarm", async (ctx) => {
    const text = ctx.match?.toString().trim();
    if (!text) {
      await ctx.reply("Send it as: /setfarm Name, Town\nExample: /setfarm Rio Verde Farm, Springfield");
      return;
    }
    const [name, town] = text.split(",").map((p) => p.trim());
    if (!name || !town) {
      await ctx.reply("Send it as: /setfarm Name, Town\nExample: /setfarm Rio Verde Farm, Springfield");
      return;
    }
    const chatId = ctx.chat.id.toString();
    await prisma.farm.upsert({
      where: { telegramChatId: chatId },
      update: { name, town },
      create: { name, town, telegramChatId: chatId },
    });
    await ctx.reply(`Saved: ${name}, ${town}. Now try /sell to post a listing.`);
  });

  bot.command("sell", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) {
      await ctx.reply("Set up your farm first: /setfarm Name, Town");
      return;
    }
    const text = ctx.match?.toString().trim();
    if (!text) {
      await ctx.reply("Send it as: /sell item, price, unit, qty, expires (optional)\nExample: /sell Tomatoes, 3.50, lb, 40, 2026-08-21");
      return;
    }
    const parsed = parseSellMessage(text);
    if (!parsed.ok) {
      await ctx.reply(parsed.error);
      return;
    }
    const listing = await prisma.listing.create({
      data: {
        farmId: farm.id,
        item: parsed.item,
        category: parsed.category,
        price: parsed.price,
        unit: parsed.unit,
        qtyAvailable: parsed.qty,
        expiresAt: parsed.expiresAt,
      },
    });
    await ctx.reply(
      `Posted: ${listing.item}, $${listing.price}/${listing.unit}, ${listing.qtyAvailable}${listing.unit} available.\nLive on the feed now.`,
    );
  });

  bot.command("mislistings", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) {
      await ctx.reply("Set up your farm first: /setfarm Name, Town");
      return;
    }
    const listings = await prisma.listing.findMany({
      where: { farmId: farm.id, status: "active" },
      orderBy: { createdAt: "asc" },
    });
    if (listings.length === 0) {
      await ctx.reply("No active listings yet. Post one with /sell");
      return;
    }
    const lines = listings.map((l, i) => `${i + 1}. ${l.item} - ${l.qtyAvailable}${l.unit} left`);
    await ctx.reply(`${lines.join("\n")}\n\nreply DELETE n to remove one`);
  });

  bot.command("pedidos", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) {
      await ctx.reply("Set up your farm first: /setfarm Name, Town");
      return;
    }
    const orders = await prisma.order.findMany({
      where: { listing: { farmId: farm.id }, status: "pending" },
      include: { listing: true },
      orderBy: { createdAt: "asc" },
    });
    if (orders.length === 0) {
      await ctx.reply("No pending orders.");
      return;
    }
    const lines = orders.map((o) => `${o.qty}${o.listing.unit} ${o.listing.item} - ${o.buyerName} (${o.buyerPhone})`);
    await ctx.reply(`${orders.length} pending order(s)\n${lines.join("\n")}`);
  });

  bot.hears(/^delete\s+(\d+)/i, async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) return;
    const n = Number(ctx.match[1]);
    const listings = await prisma.listing.findMany({
      where: { farmId: farm.id, status: "active" },
      orderBy: { createdAt: "asc" },
    });
    const target = listings[n - 1];
    if (!target) {
      await ctx.reply(`No listing #${n}. Run /mislistings to see current numbers.`);
      return;
    }
    await prisma.listing.update({ where: { id: target.id }, data: { status: "deleted" } });
    await ctx.reply(`Removed: ${target.item}`);
  });

  return bot;
}
