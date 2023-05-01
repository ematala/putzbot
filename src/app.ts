import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import express from "express";
import { Telegraf } from "telegraf";
import {
  handleGetAllDuties,
  handleGetDuty,
  handleMessage,
  handleRemind,
  handleRoomieIsDone,
  handleRotate,
  handleWelcome,
} from "./handlers";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be provided");
if (!process.env.PASSWORD) throw new Error("PASSWORD must be provided");
if (!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN must be provided");

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new Telegraf(token);
const prisma = new PrismaClient();

bot.command("start", handleWelcome);
bot.command("get", handleGetDuty(prisma));
bot.command("getall", handleGetAllDuties(prisma));
bot.command("done", handleRoomieIsDone(prisma, bot));
bot.command("remind", handleRemind(prisma, bot));
bot.command("rotate", handleRotate(prisma, bot));
bot.on("message", handleMessage(prisma));

// rotate duties every monday at 10am
// schedule("0 10 * * mon", rotate);

// send a reminder every sunday at 6pm
// schedule("0 18 * * sun", remind);

// send out trash reminders every tuesday at 6pm
// schedule("0 18 * * tue", remindTrash);

// launch bot
bot.launch();

// enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// const port = process.env.PORT ?? 3000;

// const app = express();

// app.use(bot.webhookCallback("/webhook"));
// bot.telegram.setWebhook(`${process.env.APP_URL}:8443/webhook`);

// app.get("/", (req, res) => res.status(200).send("OK"));

// const server = app.listen(port);

// export default server;
