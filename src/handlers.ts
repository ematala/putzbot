import type { PrismaClient } from "@prisma/client";
import type { Context, Telegraf } from "telegraf";
import {
  dutyIsDoneMessage,
  getAllDutiesMessage,
  getOwnDutyMessage,
  noDutiesMessage,
  reminderIsSentMessage,
  roomieHasNoDutyMessage,
  roomieIsAlreadyDoneMessage,
  roomieIsDoneMessage,
  roomieIsOnboardedMessage,
  welcomeMessage,
} from "./messages";
import { check, remind, rotate } from "./utils";

export const handleWelcome = async (ctx: Context) => {
  try {
    ctx.reply(welcomeMessage);
  } catch (error) {
    console.log(error);
  }
};

export const handleGetDuty = (prisma: PrismaClient) => async (ctx: Context) => {
  try {
    if (!(await check(prisma, ctx))) return;
    const roomie = await prisma.roomie.findUnique({
      where: { id: ctx.chat?.id },
      include: { duty: true },
    });
    const { done, duty } = roomie!;
    if (duty && done) return ctx.reply(roomieIsDoneMessage);
    if (!duty) return ctx.reply(roomieHasNoDutyMessage);
    ctx.reply(getOwnDutyMessage(duty.title, duty.description));
  } catch (error) {
    console.error(error);
  }
};

export const handleGetAllDuties =
  (prisma: PrismaClient) => async (ctx: Context) => {
    try {
      if (!(await check(prisma, ctx))) return;
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
  };

export const handleRoomieIsDone =
  (prisma: PrismaClient, bot: Telegraf) => async (ctx: Context) => {
    try {
      if (!(await check(prisma, ctx))) return;
      const roomie = await prisma.roomie.findUnique({
        where: { id: ctx.chat?.id },
        include: { duty: true },
      });
      if (!roomie?.duty) return ctx.reply(roomieHasNoDutyMessage);
      else if (roomie?.done) return ctx.reply(roomieIsAlreadyDoneMessage);
      else {
        await prisma.roomie.update({
          where: { id: ctx.chat?.id },
          data: { done: true },
        });
        ctx.reply(dutyIsDoneMessage);
        const roomies = await prisma.roomie.findMany({
          include: { duty: true },
        });
        if (roomies.every(({ done, duty }) => duty && done))
          rotate(prisma, bot);
      }
    } catch (error) {
      console.error(error);
    }
  };

export const handleRemind =
  (prisma: PrismaClient, bot: Telegraf) => async (ctx: Context) => {
    try {
      if (!(await check(prisma, ctx))) return;
      await remind(prisma, bot);
      ctx.reply(reminderIsSentMessage);
    } catch (error) {
      console.error(error);
    }
  };

export const handleRotate =
  (prisma: PrismaClient, bot: Telegraf) => async (ctx: Context) => {
    if (!(await check(prisma, ctx))) return;
    rotate(prisma, bot);
  };

export const handleMessage = (prisma: PrismaClient) => async (ctx: Context) => {
  try {
    if (
      ctx.chat?.type === "private" &&
      ctx.message &&
      "text" in ctx.message &&
      ctx.message.text === process.env.PASSWORD
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
};
