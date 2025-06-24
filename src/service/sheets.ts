import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
import credentials from "../../google-sheets-credentials.json";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID as string;

export const getSheetData = async () => {
    const doc = new GoogleSpreadsheet(SHEET_ID, {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // get first sheet
    const rows = await sheet.getRows();

    const result = rows.map(row => ({
        name: row.get('Name'),
        email: row.get('Email'),
    }));

    return result;
};
