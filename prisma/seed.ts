import { PrismaClient } from "@prisma/client";
import { trash } from "../src/data";

const prisma = new PrismaClient();

const seed = async () => {
  try {
    await Promise.all(
      [
        {
          title: "🛀🏽 Badezimmer",
          description: "Badezimmer putzen",
        },
        {
          title: "👨🏽‍🍳 Küche",
          description: "Küche putzen",
        },
        {
          title: "🧹 Wohnzimmer",
          description: "Wohnzimmer aufräumen",
        },
        {
          title: "🗑️ Müll",
          description: "Müll rausbringen",
        },
      ].map(
        async ({ title, description }, idx) =>
          await prisma.duty.create({ data: { id: idx, title, description } })
      )
    );

    await Promise.all(
      [
        "🟦 Papiertonne",
        "⬛️ Restabfalltonne",
        "🟫 Biotonne",
        "🟨 Wertstofftonne",
        "🟧 Sperrgut, Grünabfall",
      ].map(async (title) => await prisma.trash.create({ data: { title } }))
    );

    await Promise.all(
      [...new Set(Object.keys(trash))].map(
        async (key) =>
          await prisma.trashCollection.create({
            data: {
              date: new Date(key),
            },
          })
      )
    );

    // TODO @ematala implement/fix
    // await Promise.all(
    //   Object.entries(trash).map(
    //     async ([key, values]) =>
    //       await prisma.trashCollection.update({
    //         where: {
    //           date: new Date(key),
    //         },
    //         data: {
    //           trash: {
    //             connect: values.map((id) => ({ id })),
    //           },
    //         },
    //       })
    //   )
    // );
  } catch (error) {
    console.log(error);
  }
};

seed();
