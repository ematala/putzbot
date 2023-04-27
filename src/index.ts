import "dotenv/config";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { schedule } from "node-cron";
import { mapping } from "./data";

if (!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN must be provided!");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `Hi ${ctx.chat.type === "private" ? ctx.chat.first_name : "stranger"}`
  )
);
bot.command("get", (ctx) => {});
bot.command("getall", (ctx) => {});
bot.command("done", (ctx) => {});
bot.command("off", (ctx) => {});

const remind = () =>
  Promise.all(
    mapping
      .filter(({ done }) => !done)
      .map(({ roomie, duty }) =>
        bot.telegram.sendMessage(
          roomie.id,
          `Hey ${roomie.name}, du hast deinen Dienst (${duty.title}) diese Woche noch nicht erledigt!`
        )
      )
  );

bot.command("remind", async (ctx) => {
  await remind();
  ctx.reply("Ich habe die anderen daran erinnert ihre Dienste zu machen.");
});
bot.on(message("text"), (ctx) => {});

bot.launch();

// enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// send out reminders every sunday at 6pm
schedule("0 18 * * sun", remind);
