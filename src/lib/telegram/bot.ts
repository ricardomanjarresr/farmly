import { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import { parseSellMessage } from "./parse";
import { extractListingFromPhoto } from "./extract";

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
        "Or just send a photo - add a caption with price/qty/expiry for accuracy, or send it plain and I'll guess\n" +
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
    const orderLines = await prisma.orderLine.findMany({
      where: { listing: { farmId: farm.id }, order: { status: "pending" } },
      include: { listing: true, order: true },
      orderBy: { order: { createdAt: "asc" } },
    });
    if (orderLines.length === 0) {
      await ctx.reply("No pending orders.");
      return;
    }
    const lines = orderLines.map((l) => `${l.qty}${l.listing.unit} ${l.listing.item} - ${l.order.buyerName} (${l.order.buyerPhone})`);
    await ctx.reply(`${orderLines.length} pending order line(s)\n${lines.join("\n")}`);
  });

  bot.on("message:photo", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) {
      await ctx.reply("Set up your farm first: /setfarm Name, Town");
      return;
    }
    await ctx.reply("Reading the photo...");
    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const file = await ctx.api.getFile(photo.file_id);
      const rawUrl = `https://api.telegram.org/file/bot${requireToken()}/${file.file_path}`;
      const imgRes = await fetch(rawUrl);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const imageBase64 = buffer.toString("base64");
      const caption = ctx.message.caption;
      // Store our own proxy path, not the raw Telegram URL - that URL embeds
      // the bot token and this field is rendered as a public <img src>.
      const photoUrl = `/api/telegram/photo/${photo.file_id}`;

      const extracted = await extractListingFromPhoto(imageBase64, "image/jpeg", caption);

      const draft = await prisma.listing.create({
        data: {
          farmId: farm.id,
          item: extracted.item,
          category: extracted.category,
          price: extracted.price,
          unit: extracted.unit,
          qtyAvailable: extracted.qty,
          expiresAt: extracted.expiresAt,
          photoUrl,
          status: "draft",
        },
      });

      const guessNote = caption ? "" : "\n\n(No caption - price and quantity are guesses from the photo alone. Send another photo with a caption for accuracy, or cancel and use /sell.)";
      await ctx.reply(
        `I read: ${draft.item}, $${draft.price}/${draft.unit}, ${draft.qtyAvailable}${draft.unit}` +
          (draft.expiresAt ? `, expires ${draft.expiresAt.toDateString()}` : "") +
          guessNote +
          `\n\nReply confirm to post it, or cancel to discard.`,
      );
    } catch (err) {
      console.error("Photo extraction failed:", err);
      await ctx.reply(
        "Couldn't read that photo automatically. Post it as text instead:\n/sell item, price, unit, qty, expires (optional)",
      );
    }
  });

  bot.hears(/^confirm$/i, async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) return;
    const draft = await prisma.listing.findFirst({
      where: { farmId: farm.id, status: "draft" },
      orderBy: { createdAt: "desc" },
    });
    if (!draft) {
      await ctx.reply("Nothing to confirm - send a photo with /sell first.");
      return;
    }
    await prisma.listing.update({ where: { id: draft.id }, data: { status: "active" } });
    await ctx.reply(`Posted: ${draft.item}. Live on the feed now.`);
  });

  bot.hears(/^cancel$/i, async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const farm = await prisma.farm.findUnique({ where: { telegramChatId: chatId } });
    if (!farm) return;
    const draft = await prisma.listing.findFirst({
      where: { farmId: farm.id, status: "draft" },
      orderBy: { createdAt: "desc" },
    });
    if (!draft) return;
    await prisma.listing.delete({ where: { id: draft.id } });
    await ctx.reply("Discarded.");
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
