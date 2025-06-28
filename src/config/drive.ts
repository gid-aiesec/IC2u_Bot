import {google} from 'googleapis';
import dotenv from 'dotenv';
import path from "path";

dotenv.config();

// Create GoogleAuth instance
const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../../google-sheets-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

// create Google Drive client
export const drive = google.drive({ version: 'v3', auth });

