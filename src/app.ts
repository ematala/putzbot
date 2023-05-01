import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import express from "express";
import { schedule } from "node-cron";
import { Telegraf } from "telegraf";

import {
  handleGetAllDuties,
  handleGetDuty,
  handleHelp,
  handleRegister,
  handleRemind,
  handleRoomieIsDone,
  handleRotate,
  handleTrash,
  handleWelcome,
} from "./handlers";
import { auth } from "./middleware";
import { remind, remindTrash, rotate } from "./utils";

[
  "DATABASE_URL",
  "PASSWORD",
  "TELEGRAM_BOT_TOKEN",
  "APP_URL",
  "WEBHOOK_SECRET",
].forEach((key) => {
  if (!process.env[key]) throw new Error(`${key} must be provided`);
});

const token = process.env.TELEGRAM_BOT_TOKEN!;

const bot = new Telegraf(token);
const prisma = new PrismaClient();

// middleware
bot.use(Telegraf.log());
bot.use(auth(prisma));

// commands
bot.command("start", handleWelcome);
bot.command("register", handleRegister(prisma));
bot.command("get", handleGetDuty(prisma));
bot.command("getall", handleGetAllDuties(prisma));
bot.command("done", handleRoomieIsDone(prisma, bot));
bot.command("remind", handleRemind(prisma, bot));
bot.command("rotate", handleRotate(prisma, bot));
bot.command("trash", handleTrash(prisma));
bot.command("help", handleHelp);

const launch = async (bot: Telegraf) => {
  // rotate duties every monday at 10am
  schedule("0 10 * * mon", () => rotate(prisma, bot));

  // send a reminder every sunday at 6pm
  schedule("0 18 * * sun", () => remind(prisma, bot));

  // send out trash reminders every tuesday at 6pm
  schedule("0 18 * * tue", () => remindTrash(prisma, bot));

  if (process.env.NODE_ENV === "development") return bot.launch();
  const port = process.env.PORT ?? 8080;
  const app = express();

  app.use(express.json());

  app.use(
    await bot.createWebhook({
      domain: process.env.APP_URL!,
      allowed_updates: ["message"],
      path: "/telegraf",
      secret_token: process.env.WEBHOOK_SECRET,
    })
  );

  app.get("/", async (req, res) => res.status(200).send("OK"));

  return app.listen(port, () => console.log("app listening on port", port));
};

const server = launch(bot);

export default server;
