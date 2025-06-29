import {sheets} from "../config/sheets";

const SHEET_ID = process.env.SHEET_ID as string;

const getCellValue = async (sheetName: string, cell: string) => {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!${cell}`,
    });
    return res.data.values?.[0]?.[0] || "";
};
