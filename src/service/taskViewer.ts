import { bot } from "../config/bot";
import { sheets } from "../config/sheets";
import {getAdjustedCongressDay} from "../utils/getCongressDay";
import {dailyTaskRanges} from "../utils/dailtyTasksRange";
import {getDailyPassword} from "../utils/dailyPassword";

const SHEET_ID = process.env.SHEET_ID as string;

const awaitingTaskPassword = new Set<number>();

export const taskViewer = (chatId: number) => {
    awaitingTaskPassword.add(chatId);
    bot.sendMessage(chatId, "🔒 Please enter the password to view tasks:");
};


export const handleTaskPassword = async (chatId: number, text: string) => {
    try {
        const day = getAdjustedCongressDay();
        console.log("📆 Today is day", day);

        if (day < 1 || day > 9) {
            await bot.sendMessage(chatId, "📋 No tasks scheduled for today.");
            awaitingTaskPassword.delete(chatId);
            return;
        }

        const taskPassword = await getDailyPassword(day);
        console.log(`🔑 Fetched password for day ${day}:`, taskPassword);
        console.log(`💬 User input:`, text);

        if (!taskPassword) {
            await bot.sendMessage(chatId, "❌ No password set for today.");
            awaitingTaskPassword.delete(chatId);
            return;
        }

        // Compare user input and sheet password, safely trimming whitespace
        if (text.trim() === taskPassword.trim()) {
            const taskRange = dailyTaskRanges[day];
            const taskResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: taskRange,
            });

            const taskRows = taskResponse.data.values;
            if (!taskRows || taskRows.length === 0) {
                await bot.sendMessage(chatId, "📋 No tasks found.");
            } else {
                const dateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
                const taskList = taskRows
                    .map((row) => {
                        const id = row[0];
                        const task = row[1] || "Unnamed Task";
                        const points = row[2] || "0";
                        const submissionType = row[3] || "Not specified";
                        return `Task ${id}: ${task}\n Points: ${points}pts.\n Submission Type: ${submissionType}`;
                    })
                    .join("\n\n");

                await bot.sendMessage(chatId, `📋 Task list (as of ${dateString}):\n\n${taskList}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📝 Submit Responses", callback_data: "submit_responses" }],
                            [{ text: "🏆 View Score", callback_data: "view_score" }],
                            [{ text: "⬅️ Main Menu", callback_data: "back_to_menu" }],
                        ],
                    },
                });
            }
        } else {
            await bot.sendMessage(chatId, "❌ Incorrect password. Access denied.");
        }
    } catch (error) {
        console.error("❌ Error processing task password:", error);
        await bot.sendMessage(chatId, "❌ Error fetching tasks. Please try again later.");
    }

    // Always clear password input state
    awaitingTaskPassword.delete(chatId);
};

export const isAwaitingTaskPassword = (chatId: number) => {
    return awaitingTaskPassword.has(chatId);
};
