import { sheets } from "../config/sheets";
import {getCongressDay} from "./getCongressDay";
import {dailyTaskRanges} from "./dailtyTasksRange";

const SHEET_ID = process.env.SHEET_ID as string;

export const getTaskType = async (taskNumber: string): Promise<string | null> => {
    try {
        const taskRange = "TaskList!A2:E";
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: taskRange,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.warn("No tasks found.");
            return null;
        }

        const taskRow = rows.find((row) => String(row[0]).trim() === String(taskNumber).trim());
        if (!taskRow) {
            console.warn(`Task ${taskNumber} not found.`);
            return null;
        }

        const taskType = taskRow[4] || null; // E column = index 4
        return taskType ? taskType.toLowerCase().trim() : null;
    } catch (error) {
        console.error("Error fetching task type:", error);
        return null;
    }
};

// get the submission type by task number
export const getSubmissionType = async (taskNumber: string): Promise<string> => {
    const day = getCongressDay();
    if (day < 1 || day > 9) throw new Error("Invalid congress day");

    const range = dailyTaskRanges[day];

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) throw new Error("No task data found");

    const taskRow = rows.find(row => row[0] === taskNumber);
    if (!taskRow) throw new Error(`Task ${taskNumber} not found`);

    // Column D = index 3
    const submissionType = taskRow[3]?.toLowerCase() || "text";

    return submissionType;
};
