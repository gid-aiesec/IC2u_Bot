import { bot } from "../config/bot";
import { sheets } from "../config/sheets";
import {getCongressDay} from "../utils/getCongressDay";

const TASK_PASSWORD = process.env.TASK_PASSWORD as string;
const SHEET_ID = process.env.SHEET_ID as string;

const awaitingTaskPassword = new Set<number>();

const dayTaskRanges: { [key: number]: string } = {
    1: "TaskList!A3:D11",
    2: "TaskList!A12:D20",
    3: "TaskList!A21:D29",
    4: "TaskList!A30:D38",
    5: "TaskList!A39:D47",
    6: "TaskList!A48:D56",
    7: "TaskList!A57:D65",
    8: "TaskList!A66:D74",
    9: "TaskList!A75:D83",
};

export const taskViewer = (chatId: number) => {
    awaitingTaskPassword.add(chatId);
    bot.sendMessage(chatId, "🔒 Please enter the password to view tasks:");
};

export const handleTaskPassword = async (chatId: number, text: string) => {
    if (text === TASK_PASSWORD) {
        try {
            const day = getCongressDay();
            console.log(day)

            if (day < 1 || day > 9) {
                bot.sendMessage(chatId, "📋 No tasks scheduled for today.");
                awaitingTaskPassword.delete(chatId);
                return;
            }

            const range = dayTaskRanges[day];

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: range,
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                bot.sendMessage(chatId, "📋 No tasks found.");
            } else {
                const dateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
                const taskList = rows.map((row, i) => {
                    const id = row[0];
                    const task = row[1] || "Unnamed Task";
                    const points = row[2] || "0";
                    const submissionType = row[3] || "Not specified";
                    return `Task ${id}: ${task}\n Points: ${points}pts.\n Submission Type: ${submissionType}`;
                }).join("\n\n");

                bot.sendMessage(chatId, `📋 Task list (as of ${dateString}):\n\n${taskList}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📝 Submit Responses", callback_data: "submit_responses" }],
                            [{ text: "🏆 View Score", callback_data: "view_score" }],
                            [{ text: "⬅️ Main Menu", callback_data: "back_to_menu" }],
                        ],
                    },
                });
            }
        } catch (error) {
            console.error("Error reading sheet data:", error);
            bot.sendMessage(chatId, "❌ Error fetching tasks. Please try again later.");
        }
    } else {
        bot.sendMessage(chatId, "❌ Incorrect password. Access denied.");
    }

    // Clear state
    awaitingTaskPassword.delete(chatId);
};


export const isAwaitingTaskPassword = (chatId: number) => {
    return awaitingTaskPassword.has(chatId);
};
