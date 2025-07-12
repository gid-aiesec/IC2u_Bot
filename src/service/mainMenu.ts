import {bot} from "../config/bot";

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