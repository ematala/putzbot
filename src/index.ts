import "dotenv/config";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { schedule } from "node-cron";

if (!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN must be provided!");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `Hello ${ctx.chat.type === "private" ? ctx.chat.first_name : "stranger"}`
  )
);
bot.command("get", (ctx) => {});
bot.command("getall", (ctx) => {});
bot.command("done", (ctx) => {});
bot.command("off", (ctx) => {});
bot.command("remind", (ctx) => {});
bot.on(message("text"), (ctx) => {});

bot.launch();

// enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
