import { bot } from "../config/bot";
import { sheets } from "../config/sheets";
import { getAdjustedCongressDay } from "../utils/getCongressDay";
import { dailyTaskRanges } from "../utils/dailtyTasksRange";
import { getDailyPassword } from "../utils/dailyPassword";

const SHEET_ID = process.env.SHEET_ID as string;

// Track users currently asked for password
const awaitingTaskPassword = new Set<number>();

// Track users authorized per day: chatId -> dayNumber
const authorizedTaskViewers = new Map<number, number>();

// When user requests to view tasks
export const taskViewer = async (chatId: number) => {
    const day = getAdjustedCongressDay();

    if (day < 1 || day > 9) {
        await bot.sendMessage(chatId, "📋 No tasks scheduled for today.");
        return;
    }

    // If already authorized for today, send tasks immediately
    if (authorizedTaskViewers.get(chatId) === day) {
        await sendTasks(chatId, day);
        return;
    }

    // Otherwise, ask for password
    awaitingTaskPassword.add(chatId);
    await bot.sendMessage(chatId, "🔒 Please enter the password to view tasks:");
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

        // If already authorized, just send tasks and clear awaiting state
        if (authorizedTaskViewers.get(chatId) === day) {
            await sendTasks(chatId, day);
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

        if (text.trim() === taskPassword.trim()) {
            // Authorize user for today
            authorizedTaskViewers.set(chatId, day);

            // Send tasks
            await sendTasks(chatId, day);
        } else {
            await bot.sendMessage(chatId, "❌ Incorrect password. Access denied.");
        }
    } catch (error) {
        console.error("❌ Error processing task password:", error);
        await bot.sendMessage(chatId, "❌ Error fetching tasks. Please try again later.");
    }

    // Clear awaiting password state regardless of success/failure
    awaitingTaskPassword.delete(chatId);
};

const sendTasks = async (chatId: number, day: number) => {
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
};

export const isAwaitingTaskPassword = (chatId: number) => {
    return awaitingTaskPassword.has(chatId);
};
