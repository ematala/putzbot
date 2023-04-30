import type { Context } from "telegraf";
import { closestIndexTo, closestTo, format } from "date-fns";
import { prisma } from ".";
import { roomieIsNotRegisteredMessage } from "./messages";
import { trash } from "./data";

const trashMap: Record<number, string> = {
  0: "🟦 Papiertonne",
  1: "⬛️ Restabfalltonne",
  2: "🟫 Biotonne",
  3: "🟨 Wertstofftonne",
  4: "🟧 Sperrgut, Grünabfall",
};

const parseDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getTrashItems = async () => {
  const dates = Object.keys(trash)
    .map(parseDate)
    .filter((d) => d > new Date());
  const closest = closestTo(new Date(), dates);
  if (!closest) return [];
  const date = format(closest, "yyyy-MM-dd");
  return trash[date].map((t) => trashMap[t]);
};

// TODO @ematala implement/fix seeds to use this function
export const getTrashItemsNew = async () => {
  const collection = await prisma.trashCollection.findMany({
    include: { trash: true },
    where: { date: { gte: new Date() } },
  });
  const closest = closestIndexTo(
    new Date(),
    collection.map((c) => c.date)
  );
  if (!closest) return [];
  return collection[closest].trash.map(({ title }) => title);
};

export const check = async (ctx: Context) => {
  try {
    if (!ctx.chat?.id) return false;
    const roomie = await prisma.roomie.findUnique({
      where: { id: ctx.chat.id },
    });
    if (!roomie) {
      ctx.reply(roomieIsNotRegisteredMessage);
      return false;
    } else return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
