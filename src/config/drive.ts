import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;

if (!credentialsJson) {
    throw new Error("Missing GOOGLE_SHEETS_CREDENTIALS in environment variables");
}

const credentials = JSON.parse(credentialsJson);

// Create GoogleAuth instance using credentials from .env
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

// create Google Drive client
export const drive = google.drive({ version: 'v3', auth });
