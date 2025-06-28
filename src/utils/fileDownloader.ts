import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import TelegramBot from 'node-telegram-bot-api';

/**
 * Downloads the largest size photo from a photo array, saves it locally, and returns the file path.
 * @param bot The TelegramBot instance
 * @param photos The photo array from msg.photo
 * @returns The full local file path
 */
export async function downloadImageFromTelegram(bot: TelegramBot, photos: TelegramBot.PhotoSize[]): Promise<string> {
    if (!photos || photos.length === 0) {
        throw new Error('No photo provided.');
    }

    // Pick the largest resolution photo (last one)
    const fileId = photos[photos.length - 1].file_id;

    // Get file details
    const file = await bot.getFile(fileId);

    // Build direct download URL
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    // Prepare local file path
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    const fileName = `response_${uuidv4()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    // Download file stream
    const writer = fs.createWriteStream(filePath);
    const response = await axios({ url: fileUrl, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return filePath;
}
