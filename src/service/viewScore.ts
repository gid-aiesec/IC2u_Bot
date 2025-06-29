import { bot } from "../config/bot";
import {sheets} from "../config/sheets";

const SHEET_ID = process.env.SHEET_ID as string;

// Fetch overall score of the user
export const viewScore = async (chatId: number) => {
    try {
        const range = "Results!A3:K";
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range,
        });

        const rows = response.data.values || [];

        // Find the user's row by chatId (column 0)
        const userRow = rows.find(row => row[0] === chatId.toString());

        let totalScore = 0;

        if (userRow && userRow.length > 10) {
            totalScore = Number(userRow[10]) || 0;
        }

        const dateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

        await bot.sendMessage(chatId, `🏆 Your current total score as of ${dateString} is: ${totalScore} points.`);
    } catch (error) {
        console.error("Error fetching score:", error);
        await bot.sendMessage(chatId, "❌ Unable to fetch your score at the moment. Please try again later.");
    }
};

// Add points for each valid response
export const addPointsToResults = async (chatId: number, points: number, day: number) => {
    const resultsSheet = "Results";

    // Get all rows to find this user
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${resultsSheet}!A:Z`,
    });

    const values = res.data.values || [];
    const headers = values[1]; // assuming row 2 is headers
    const dayColIndex = headers.indexOf(`Day 0${day}`);
    const totalColIndex = headers.indexOf("Total");
    const chatIdColIndex = headers.indexOf("Chat Id");

    if (dayColIndex === -1 || totalColIndex === -1) {
        console.error("Could not find day or total columns in Results sheet.");
        return;
    }

    let rowIndex = values.findIndex(row => row[chatIdColIndex] == chatId);

    if (rowIndex === -1) {
        // Append new row if user not found
        rowIndex = values.length;
        const newRow = Array(headers.length).fill("0");
        newRow[chatIdColIndex] = chatId;
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${resultsSheet}!A:Z`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [newRow] },
        });
    }

    // Fetch current points in day and total
    const currentDayPoints = Number(values[rowIndex]?.[dayColIndex] || 0);
    const currentTotal = Number(values[rowIndex]?.[totalColIndex] || 0);

    // Update values
    const newDayPoints = currentDayPoints + points;
    const newTotal = currentTotal + points;

    // Update day column
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${resultsSheet}!${String.fromCharCode(65 + dayColIndex)}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newDayPoints]] },
    });

    // Update total column
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${resultsSheet}!${String.fromCharCode(65 + totalColIndex)}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newTotal]] },
    });
};

// Fetch Daily score of the user
export const getDailyScore = async (chatId: number, day: number): Promise<number> => {
    const resultsSheet = "Results";
    const dayColumnLetter = String.fromCharCode(66 + (day - 1)); // B = day 1, C = day 2...

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${resultsSheet}!A2:Z`, // assume chatIds are in column A from row 2
    });

    const rows = res.data.values;
    if (!rows) return 0;

    for (const row of rows) {
        if (Number(row[0]) === chatId) {
            const dayScore = Number(row[dayColumnLetter.charCodeAt(0) - 65] || 0);
            return dayScore;
        }
    }
    return 0;
};

