import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;

if (!credentialsJson) {
    throw new Error("Missing GOOGLE_SHEETS_CREDENTIALS in environment variables");
}

// Parse JSON string to object
const credentials = JSON.parse(credentialsJson);

// Create GoogleAuth instance using the credentials object
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const sheets = google.sheets({ version: 'v4', auth });
