import type { PrismaClient } from "@prisma/client";
import type { Context } from "telegraf";
import { message } from "telegraf/filters";

const protectedCommands = [
  "/get",
  "/getall",
  "/done",
  "/remind",
  "/rotate",
  "/trash",
  "/help",
];
export const auth =
  (prisma: PrismaClient) => async (ctx: Context, next: () => Promise<void>) => {
    try {
      const roomie = await prisma.roomie.findUnique({
        where: { id: ctx.chat?.id },
      });
      if (!ctx.has(message("text"))) return false;
      if (!roomie && protectedCommands.includes(ctx.message.text)) return false;
      else return next();
    } catch (error) {
      console.error(error);
    }
  };
