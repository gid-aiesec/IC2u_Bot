import {bot} from "../config/bot";
import {sheets} from "../config/sheets";
import {taskViewer, isAwaitingTaskPassword, handleTaskPassword } from "./taskViewer";
import {handleResponseMessage, isAwaitingResponse, responseHandler} from "./responseHandler";
import {viewScore} from "./viewScore";

const SHEET_ID = process.env.SHEET_ID as string;
const SHEET_NAME = "Registration";

// Regex for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Start Message
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        const alreadyRegistered = await isUserRegistered(chatId);

        if (alreadyRegistered) {
            await bot.sendMessage(chatId, "👋 Welcome back, AIESECer!");
            await sendMainMenu(chatId);
            return;
        }

        await bot.sendMessage(chatId, "Hello AIESECer! 👋\n\nWelcome to the OFFICIAL IC2u Bot at INTERNATIONAL CONGRESS 2025, Sri Lanka! 🇱🇰");
        await bot.sendMessage(chatId, "Please send me the following details in this format:\n\n" +
            "`Full Name`\n`Telegram Handle`\n`Email Address`\n`Entity`\n\nExample:\nJohn Doe\n@johndoe\njohn@example.com\nAIESEC in Sri Lanka", {
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Error in /start:", error);
        await bot.sendMessage(chatId, "❌ Oops — something went wrong. Please try again later.");
    }
});


// message handler
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.text && !msg.photo) return;
    if (msg.text?.startsWith("/start")) return;

    if (isAwaitingTaskPassword(chatId)) {
        if (msg.text) await handleTaskPassword(chatId, msg.text);
        return;
    }

    if (isAwaitingResponse(chatId)) {
        await handleResponseMessage(msg);
        return;
    }

    if (msg.text) {
        try {
            const alreadyRegistered = await isUserRegistered(chatId);

            if (alreadyRegistered) {
                await bot.sendMessage(chatId, "⚠️ You've already submitted your details.");
                await sendMainMenu(chatId);
                return;
            }

            const lines = msg.text.split("\n");
            if (lines.length !== 4) {
                await bot.sendMessage(chatId, "⚠️ Please send *exactly four details*, each on a new line in this format:\n\n" +
                    "`Full Name`\n`Telegram Handle`\n`Email Address`\n`Entity`", {parse_mode: "Markdown"});
                return;
            }

            const [fullName, telegramHandle, email, entity] = lines.map(line => line.trim());

            if (!fullName || !telegramHandle.startsWith("@") || !emailRegex.test(email) || !entity) {
                await bot.sendMessage(chatId, "⚠️ Invalid details detected. Please make sure:\n\n" +
                    "- *Full Name* is not empty\n" +
                    "- *Telegram Handle* starts with `@`\n" +
                    "- *Email* is a valid email address (e.g. john@example.com)\n" +
                    "- *Entity* is not empty\n\n" +
                    "Then send the four details again in this exact format.", {parse_mode: "Markdown"});
                return;
            }

            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!A:E`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [[fullName, telegramHandle, email, entity, chatId]],
                },
            });

            await bot.sendMessage(chatId, "✅ Thank you! Your registration has been successfully recorded.");
            await sendMainMenu(chatId);

        } catch (error) {
            console.error("Error saving registration:", error);
            await bot.sendMessage(chatId, "❌ Oops — there was an error saving your details. Please try again later.");
        }
    }
});


// Callback query handler
bot.on("callback_query", (query) => {
    const chatId = query.message?.chat.id;
    const data = query.data;

    if (!chatId || !data) return;

    switch (data) {
        case "view_tasks":
            taskViewer(chatId);
            break;

        case "submit_responses":
            responseHandler(chatId);
            break;

        case "view_score":
            viewScore(chatId);
            break;

        case "back_to_menu":
            sendMainMenu(chatId);
            break;

        default:
            bot.sendMessage(chatId, "⚠️ Unknown action.");
    }

    bot.answerCallbackQuery(query.id);
});

// Check whether the user is registered or not
export const isUserRegistered = async (chatId: number): Promise<boolean> => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!E2:E`,
        });

        const existingChatIds = response.data.values
            ? response.data.values.flat().map(id => String(id))
            : [];

        return existingChatIds.includes(String(chatId));
    } catch (err) {
        console.error("Error checking registration:", err);
        return false;
    }
};

//send main menu
export const sendMainMenu = async (chatId: number) => {
    await bot.sendMessage(chatId, "📋 Main Menu:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "📋 View Tasks", callback_data: "view_tasks" }],
                [{ text: "📝 Submit Responses", callback_data: "submit_responses" }],
                [{ text: "🏆 View Score", callback_data: "view_score" }],
            ],
        },
    });
};
