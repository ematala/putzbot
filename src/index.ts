import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { schedule } from "node-cron";
import { Telegraf } from "telegraf";
import { check } from "./utils";
import {
  getDutiesRotatedMessage,
  dutyIsDoneMessage,
  getAllDutiesMessage,
  getOwnDutyMessage,
  noDutiesMessage,
  getReminderMessage,
  reminderIsSentMessage,
  roomieHasNoDutyMessage,
  roomieIsAlreadyDoneMessage,
  roomieIsDoneMessage,
  roomieIsOnboardedMessage,
  getTrashReminderMessage,
  welcomeMessage,
} from "./messages";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be provided");
if (!process.env.PASSWORD) throw new Error("PASSWORD must be provided");
if (!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN must be provided");

const token = process.env.TELEGRAM_BOT_TOKEN;
const password = process.env.PASSWORD;

export const bot = new Telegraf(token);
export const prisma = new PrismaClient();

bot.command("start", (ctx) => {
  try {
    ctx.reply(welcomeMessage);
  } catch (error) {
    console.log(error);
  }
});

bot.command("get", async (ctx) => {
  try {
    if (!(await check(ctx))) return;
    const roomie = await prisma.roomie.findUnique({
      where: { id: ctx.chat.id },
      include: { duty: true },
    });
    const { done, duty } = roomie!;
    if (duty && done) return ctx.reply(roomieIsDoneMessage);
    if (!duty) return ctx.reply(roomieHasNoDutyMessage);
    ctx.reply(getOwnDutyMessage(duty.title, duty.description));
  } catch (error) {
    console.error(error);
  }
});

bot.command("getall", async (ctx) => {
  try {
    if (!(await check(ctx))) return;
    const roomies = await prisma.roomie.findMany({ include: { duty: true } });
    const message = roomies
      .filter(({ duty }) => duty)
      .map(({ name, done, duty }) =>
        getAllDutiesMessage(done, name, duty!.title, duty!.description)
      )
      .join("\n");
    if (!message) ctx.reply(noDutiesMessage);
    else ctx.reply(message);
  } catch (error) {
    console.error(error);
  }
});

bot.command("done", async (ctx) => {
  try {
    if (!(await check(ctx))) return;
    const roomie = await prisma.roomie.findUnique({
      where: { id: ctx.chat.id },
      include: { duty: true },
    });
    if (!roomie?.duty) return ctx.reply(roomieHasNoDutyMessage);
    else if (roomie?.done) return ctx.reply(roomieIsAlreadyDoneMessage);
    else {
      await prisma.roomie.update({
        where: { id: ctx.chat.id },
        data: { done: true },
      });
      ctx.reply(dutyIsDoneMessage);
      const roomies = await prisma.roomie.findMany({ include: { duty: true } });
      if (roomies.every(({ done, duty }) => duty && done)) rotate();
    }
  } catch (error) {
    console.error(error);
  }
});

const remind = async () => {
  try {
    const roomies = await prisma.roomie.findMany({ include: { duty: true } });
    Promise.all(
      roomies
        .filter(({ done, duty }) => duty && !done)
        .map(({ id, name, duty }) =>
          bot.telegram.sendMessage(id, getReminderMessage(name, duty!.title))
        )
    );
  } catch (error) {
    console.error(error);
  }
};

// This needs to be the id of the trash duty
const TRASHID = 4;
const remindTrash = async () => {
  try {
    const roomie = await prisma.roomie.findUnique({
      where: { dutyId: TRASHID },
    });
    if (!roomie || roomie.done) return;
    bot.telegram.sendMessage(roomie.id, await getTrashReminderMessage());
  } catch (error) {
    console.error(error);
  }
};

bot.command("remind", async (ctx) => {
  try {
    if (!(await check(ctx))) return;
    await remind();
    ctx.reply(reminderIsSentMessage);
  } catch (error) {
    console.error(error);
  }
});

const rotate = async () => {
  try {
    const roomies = await prisma.roomie.findMany({ include: { duty: true } });
    const duties = await prisma.duty.findMany();
    if (!roomies.every(({ duty, done }) => duty && done)) remind();
    else {
      roomies
        .filter(({ duty }) => duty)
        .forEach(async ({ id, duty }) => {
          const newDuty = duties.at(duty?.id! % duties.length)!;
          await prisma.roomie.update({
            where: { id },
            data: {
              done: false,
              dutyId: newDuty.id,
            },
          });
          bot.telegram.sendMessage(
            id,
            getDutiesRotatedMessage(newDuty.title, newDuty.description)
          );
        });
    }
  } catch (error) {
    console.error(error);
  }
};

bot.command("rotate", async (ctx) => {
  if (!(await check(ctx))) return;
  rotate();
});

bot.on("message", async (ctx) => {
  try {
    if (
      ctx.chat.type === "private" &&
      "text" in ctx.message &&
      ctx.message.text === password
    ) {
      await prisma.roomie.upsert({
        where: { id: ctx.chat.id },
        update: {},
        create: {
          id: ctx.chat.id,
          name: ctx.chat.first_name,
        },
      });
      ctx.reply(roomieIsOnboardedMessage(ctx.chat.first_name));
    }
  } catch (error) {
    console.error(error);
  }
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
