import { bot } from "../config/bot";
import {sheets} from "../config/sheets";
import {getCongressDay} from "../utils/getCongressDay";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import {uploadImageToDrive} from "../utils/imageUploader";
import {downloadImageFromTelegram} from "../utils/fileDownloader";
import path from "path";

const SHEET_ID = process.env.SHEET_ID as string;
const awaitingResponse = new Map<number, boolean>();
const awaitingImageResponseTaskId = new Map<number, string>();

export const responseHandler = (chatId: number) => {
    bot.sendMessage(
        chatId,
        `Submit your responses in the following format:\n\n` +
        `*Task Number*\n*Your Response*\n\n` +
        `*Example:*\n1\nThe acronym for AIESEC values is 'SALADE'`,
        {
            parse_mode: "Markdown"
        }
    );

    // Set response mode ON for this user
    awaitingResponse.set(chatId, true);
};


export const handleResponseMessage = async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const photo = msg.photo;

    if (!awaitingResponse.has(chatId)) return;

    const day = getCongressDay();
    if (day < 1 || day > 9) {
        bot.sendMessage(chatId, "⚠️ Responses are not being accepted today.");
        awaitingResponse.delete(chatId);
        return;
    }

    const targetSheet = `Responses-D${day}`;
    const dateString = new Date().toLocaleString("en-GB", { timeZone: "Asia/Colombo" });

    // 📦 Image response
    if (photo && photo.length > 0) {
        const taskNumber = awaitingImageResponseTaskId.get(chatId);
        if (!taskNumber) {
            bot.sendMessage(chatId, "⚠️ Please first send the Task Number before sending your image response.");
            return;
        }

        try {
            const filePath = await downloadImageFromTelegram(bot, photo);
            const fileName = path.basename(filePath);
            const publicUrl = await uploadImageToDrive(filePath, fileName);

            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: `${targetSheet}!A:D`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [[dateString, chatId, taskNumber, publicUrl]],
                },
            });

            bot.sendMessage(chatId, "✅ Your image response has been recorded successfully.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📋 View Tasks", callback_data: "view_tasks" }],
                        [{ text: "📝 Submit Responses", callback_data: "submit_responses" }],
                        [{ text: "🏆 View Score", callback_data: "view_score" }],
                    ],
                },
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error("Error processing image response:", error);
            bot.sendMessage(chatId, "❌ Error saving your image response. Please try again.");
        }

        awaitingImageResponseTaskId.delete(chatId);
        awaitingResponse.delete(chatId);
        return;
    }

    // Text response
    if (text) {
        const lines = text.split("\n");

        // Case: single line numeric task number (awaiting image next)
        if (lines.length === 1 && !isNaN(Number(lines[0].trim()))) {
            const taskNumber = lines[0].trim();
            awaitingImageResponseTaskId.set(chatId, taskNumber);
            bot.sendMessage(chatId, `📸 Now send your image response for Task ${taskNumber}`);
            return;
        }

        // Case: full text response (2 lines)
        if (lines.length !== 2) {
            bot.sendMessage(
                chatId,
                "⚠️ Invalid format. Please submit your response in *exactly two lines*:\n\n" +
                "`Task Number`\n`Your Response`\n\nExample:\n1\nAIESEC was founded in 1948.",
                { parse_mode: "Markdown" }
            );
            return;
        }

        const [taskNumber, responseText] = lines.map((line) => line.trim());

        if (!taskNumber || isNaN(Number(taskNumber)) || !responseText) {
            bot.sendMessage(chatId, "⚠️ Invalid task number or empty response. Please try again.");
            return;
        }

        try {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: `${targetSheet}!A:D`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [[dateString, chatId, taskNumber, responseText]],
                },
            });

            bot.sendMessage(chatId, "✅ Your response has been recorded successfully.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📋 View Tasks", callback_data: "view_tasks" }],
                        [{ text: "📝 Submit Responses", callback_data: "submit_responses" }],
                        [{ text: "🏆 View Score", callback_data: "view_score" }],
                    ],
                },
            });
        } catch (error) {
            console.error("Error saving text response:", error);
            bot.sendMessage(chatId, "❌ There was an error saving your response. Please try again later.");
        }

        awaitingResponse.delete(chatId);
        return;
    }
};

export const isAwaitingResponse = (chatId: number) => {
    return awaitingResponse.has(chatId);
};
