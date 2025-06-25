import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import {readSheetData} from "../service/sheets";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN as string;

export const bot = new TelegramBot(token, { polling: true });

// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, "Hello AIESECer! Welcome to the OFFICIAL IC2u Bot in INTERNATIONAL CONGRESS 2025, Sri Lanka.").then(r => {});
// });

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        // Read data from sheet (adjust range as needed)
        const data = await readSheetData("Sheet1!A1:A5");

        // Format data into a message string
        const formattedData = data.map(row => row.join(', ')).join('\n');

        // Send welcome + sheet data message
        const welcomeMessage = "Hello AIESECer! Welcome to the OFFICIAL IC2u Bot in INTERNATIONAL CONGRESS 2025, Sri Lanka.\n\nHere is your requested data from the sheet:\n" + formattedData;

        await bot.sendMessage(chatId, welcomeMessage);
    } catch (err) {
        await bot.sendMessage(chatId, "Sorry, I couldn't fetch data from the sheet right now.");
    }
});
