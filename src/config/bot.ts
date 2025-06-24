import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN as string;

export const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello AIESECer! Welcome to the OFFICIAL IC2u Bot in INTERNATIONAL CONGRESS 2025, Sri Lanka.").then(r => {});
});
