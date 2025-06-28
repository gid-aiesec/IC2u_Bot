import { bot } from "../config/bot";

export const viewScore = (chatId: number) => {
    const dateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

    bot.sendMessage(
        chatId,
        `🏆 Your current score as of ${dateString} is: 0 points (scoring coming soon!)`
    );
};