import cron from "node-cron";
import { bot } from "../config/bot";
import { sheets } from "../config/sheets";
import { getCongressDay } from "./getCongressDay";
import { getDailyPassword } from "./dailyPassword";

const SHEET_ID = process.env.SHEET_ID as string;

// Fetch chat IDs from Registrations sheet
const getRegisteredChatIds = async (): Promise<number[]> => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Registration!E2:E",
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.warn("📄 No registered chat IDs found.");
            return [];
        }

        // Convert valid numeric chat IDs
        const chatIds = rows
            .map((row) => Number(row[0]))
            .filter((id) => !isNaN(id) && id !== 0);

        console.log("📦 Fetched registered chat IDs:", chatIds);
        return chatIds;
    } catch (error) {
        console.error("❌ Error fetching registered chat IDs:", error);
        return [];
    }
};

// Schedule job at 9:00 AM Asia/Colombo every day
cron.schedule(
    "0 9 * * *",
    async () => {
        console.log("⏰ Running daily password broadcast job...");

        const day = getCongressDay();
        console.log("📆 Today is congress day:", day);

        // Validate congress day
        if (day < 1 || day > 9) {
            console.log("🚫 No active congress day today. Skipping notification.");
            return;
        }

        // Get today's password
        const password = await getDailyPassword(day);
        if (!password) {
            console.error("❌ No password found for today.");
            return;
        }

        // Fetch registered chat IDs from sheet
        const registeredChatIds = await getRegisteredChatIds();
        if (registeredChatIds.length === 0) {
            console.warn("🚫 No users to notify.");
            return;
        }

        // Message text
        const messageText = `📆 Good morning AIESECers! Your tasklist for *Day ${String(day).padStart(2, "0")}* has been updated.\n\n New password will be revealed at morning plannery for today's tasks.`;

        // Send to all registered users
        for (const chatId of registeredChatIds) {
            try {
                await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
                console.log(`✅ Sent password to chat ID: ${chatId}`);
            } catch (err) {
                console.error(`❌ Failed to send to chat ID ${chatId}:`, err);
            }
        }
    },
    {
        timezone: "Asia/Colombo",
    }
);
