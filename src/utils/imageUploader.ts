import fs from "fs";
import {drive} from "../config/drive";

export async function uploadImageToDrive(filePath: string, fileName: string): Promise<string> {
    try {
        const fileMetadata: any = {
            name: fileName,
        };

        if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
            fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
        }

        const media = {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(filePath),
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });

        const fileId = file.data.id;

        // Set file permission to public
        await drive.permissions.create({
            fileId: fileId!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        return publicUrl;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}
