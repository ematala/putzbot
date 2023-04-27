import "dotenv/config";
import { Telegraf } from "telegraf";
import { schedule } from "node-cron";
import { mapping } from "./data";
import { getTrash } from "./utils";
import { TRASHID } from "./constants";

if (!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN must be provided!");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `Hi ${ctx.chat.type === "private" && (ctx.chat.first_name ?? "stranger")}`
  )
);

bot.command("get", (ctx) => {
  const { duty, done } = mapping.find(
    ({ roomie }) => roomie.id === ctx.chat.id
  )!;
  if (done) ctx.reply("Du bist für diese Woche fertig");
  else ctx.reply(`Du bist dran mit ${duty.title} (${duty.description})`);
});

bot.command("getall", (ctx) => {
  const message = mapping
    .map(({ roomie, duty, done }) =>
      done
        ? `${roomie.name} ist fertig`
        : `${roomie.name} ist dran mit ${duty.title} (${duty.description})`
    )
    .join("\n");
  ctx.reply(message);
});

bot.command("done", (ctx) => {
  const m = mapping.find(({ roomie }) => roomie.id === ctx.chat.id)!;
  if (m.done) return ctx.reply("Du bist schon fertig");
  else {
    m.done = true;
    ctx.reply("Super, du hast deinen Dienst für diese Woche erledigt!");
  }
});

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

const remindTrash = () => {
  const { roomie, done } = mapping.find(({ duty }) => duty.id === TRASHID)!;
  if (done) return;
  const message = [
    "Hey, du musst den Müll rausbringen: \n",
    ...getTrash(),
  ].join("\n");
  bot.telegram.sendMessage(roomie.id, message);
};

bot.command("remind", async (ctx) => {
  await remind();
  ctx.reply("Ich habe die anderen daran erinnert ihre Dienste zu machen.");
});

// send out reminders every sunday at 6pm
schedule("0 18 * * sun", remind);

// send out trash reminders every tuesday at 6pm
schedule("0 18 * * tue", remindTrash);

// launch bot
bot.launch();

// enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
