import { sheets } from "../config/sheets";

const SHEET_ID = process.env.SHEET_ID as string;

export const getDailyPassword = async (day: number): Promise<string | null> => {
    try {
        const passwordRange = "Passwords!A2:B10";
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: passwordRange,
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.error("No password data found in sheet.");
            return null;
        }

        const dayString = `Day ${String(day).padStart(2, "0")}`;

        const passwordRow = rows.find((row) => row[0].trim() === dayString);
        console.log(`Matching row for ${dayString}:`, passwordRow);

        if (!passwordRow) {
            console.warn(`No password found for ${dayString}.`);
            return null;
        }

        return passwordRow[1] || null;
    } catch (error) {
        console.error("Error fetching password from sheet:", error);
        return null;
    }
};
