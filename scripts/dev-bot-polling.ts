import "dotenv/config";
import { createBot } from "../src/lib/telegram/bot";

const bot = createBot();

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start({
  onStart: () => console.log("Farmly bot is running (long polling). Message it on Telegram now."),
});
