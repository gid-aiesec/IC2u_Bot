import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const SHEET_ID = process.env.SHEET_ID as string;

// Create GoogleAuth instance
const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../../google-sheets-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const sheets = google.sheets({ version: 'v4', auth });

// export const readSheetData = async(range: string) => {
//     try {
//         const response = await sheets.spreadsheets.values.get({
//             spreadsheetId: SHEET_ID,
//             range,
//         });
//
//         const rows = response.data.values;
//         if (!rows || rows.length === 0) {
//             console.log('No data found.');
//             return [];
//         }
//
//         return rows;
//     } catch (error) {
//         console.error('Error reading sheet data:', error);
//         throw error;
//     }
// }
