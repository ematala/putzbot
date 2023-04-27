import "dotenv/config";
import { Telegraf } from "telegraf";
import { schedule } from "node-cron";
import { duties, mapping, roomies } from "./data";
import { check, getTrash } from "./utils";
import { TRASHID } from "./constants";

if (!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN must be provided");

if (roomies.length !== duties.length)
  throw new Error("roomies and duties must be the same length");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) => {
  console.info(new Date(), "\nNEW USER\n", ctx.chat);
  ctx.reply(
    `Hi ${
      ctx.chat.type === "private" && (ctx.chat.first_name ?? "stranger")
    } 👋🏽`
  );
});

bot.command("get", (ctx) => {
  if (!check(ctx.chat.id)) return;
  const { duty, done } = mapping.find(
    ({ roomie }) => roomie.id === ctx.chat.id
  )!;
  if (done) ctx.reply("Du bist für diese Woche fertig 👍🏽");
  else ctx.reply(`Du bist dran mit ${duty.title} (${duty.description})`);
});

bot.command("getall", (ctx) => {
  if (!check(ctx.chat.id)) return;
  const message = mapping
    .map(({ roomie, duty, done }) =>
      done
        ? `✅ ${roomie.name} ist fertig`
        : `${roomie.name} ist dran mit ${duty.title} (${duty.description})`
    )
    .join("\n");
  ctx.reply(message);
});

bot.command("done", (ctx) => {
  if (!check(ctx.chat.id)) return;
  const m = mapping.find(({ roomie }) => roomie.id === ctx.chat.id)!;
  if (m.done) return ctx.reply("Du bist schon fertig 🤔");
  else {
    m.done = true;
    ctx.reply("Super, du hast deinen Dienst für diese Woche erledigt! 🍻");
  }
});

const remind = () =>
  Promise.all(
    mapping
      .filter(({ done }) => !done)
      .map(({ roomie, duty }) =>
        bot.telegram.sendMessage(
          roomie.id,
          `Hey ${roomie.name}, du hast deinen Dienst (${duty.title}) diese Woche noch nicht erledigt! 😒`
        )
      )
  );

const remindTrash = () => {
  const { roomie, done } = mapping.find(({ duty }) => duty.id === TRASHID)!;
  if (done) return;
  const message = [
    "Hey, du musst den Müll rausbringen 🚛 \n",
    ...getTrash(),
  ].join("\n");
  bot.telegram.sendMessage(roomie.id, message);
};

bot.command("remind", async (ctx) => {
  if (!check(ctx.chat.id)) return;
  await remind();
  ctx.reply("Ich habe die anderen daran erinnert ihre Dienste zu machen.");
});

const rotate = () => {
  if (!mapping.every(({ done }) => done)) remind();
  else {
    duties.push(duties.shift()!);
    mapping.forEach((m) => {
      m.done = false;
      m.duty = duties[m.duty.id];
    });
  }
};

bot.command("rotate", (ctx) => {
  if (!check(ctx.chat.id)) return;
  rotate();
});

// rotate duties every monday at 10am
schedule("0 10 * * mon", rotate);

// send a reminder every sunday at 6pm
schedule("0 18 * * sun", remind);

// send out trash reminders every tuesday at 6pm
schedule("0 18 * * tue", remindTrash);

// launch bot
bot.launch();

// enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
