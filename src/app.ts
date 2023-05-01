import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import express from "express";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

import {
  handleGetAllDuties,
  handleGetDuty,
  handleMessage,
  handleRemind,
  handleRoomieIsDone,
  handleRotate,
  handleWelcome,
} from "./handlers";
import { auth, log } from "./middleware";

["DATABASE_URL", "PASSWORD", "TELEGRAM_BOT_TOKEN", "APP_URL"].forEach((key) => {
  if (!process.env[key]) throw new Error(`${key} must be provided`);
});

const token = process.env.TELEGRAM_BOT_TOKEN!;

const bot = new Telegraf(token);
const prisma = new PrismaClient();

// middleware
bot.use(log);
bot.use(auth(prisma));

// commands
bot.command("start", handleWelcome);
bot.command("get", handleGetDuty(prisma));
bot.command("getall", handleGetAllDuties(prisma));
bot.command("done", handleRoomieIsDone(prisma, bot));
bot.command("remind", handleRemind(prisma, bot));
bot.command("rotate", handleRotate(prisma, bot));
bot.on(message("text"), handleMessage(prisma));

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

// const port = process.env.PORT ?? 8080;
// const app = express();

// app.use(express.json());

// // app.use(async () => await bot.createWebhook({ domain: process.env.APP_URL! }));
// app.post("/", (req, res) => {
//   console.log("request body", req.body);
//   res.status(200).send("OK");
// });

// const server = app.listen(port, () =>
//   console.log("app listening on port", port)
// );

// export default server;
