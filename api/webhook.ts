import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN ?? "");

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { body } = req;

    // Ensure that this is a message being sent
    if (body.message) {
      // Retrieve the ID for this chat
      const {
        chat: { id },
        text,
      } = body.message;

      await bot.telegram.sendMessage(id, `You said: ${text}`);
    }
  } catch (error) {
    console.error(error);
  }
  res.status(200).send("OK");
};
