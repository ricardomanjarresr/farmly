import { webhookCallback } from "grammy";
import { createBot } from "@/lib/telegram/bot";

export const POST = webhookCallback(createBot(), "std/http");
