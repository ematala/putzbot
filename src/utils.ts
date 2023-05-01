import type { PrismaClient } from "@prisma/client";
import { closestIndexTo, closestTo, format } from "date-fns";
import type { Telegraf } from "telegraf";
import { trash } from "./data";
import {
  getDutiesRotatedMessage,
  getReminderMessage,
  getTrashReminderMessage,
} from "./messages";

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
export const getTrashItemsNew = async (prisma: PrismaClient) => {
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

export const remind = async (prisma: PrismaClient, bot: Telegraf) => {
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
export const remindTrash = async (prisma: PrismaClient, bot: Telegraf) => {
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

export const rotate = async (prisma: PrismaClient, bot: Telegraf) => {
  try {
    const roomies = await prisma.roomie.findMany({ include: { duty: true } });
    const duties = await prisma.duty.findMany();
    if (!roomies.every(({ duty, done }) => duty && done)) remind(prisma, bot);
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
