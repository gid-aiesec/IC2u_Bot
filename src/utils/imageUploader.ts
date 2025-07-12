import fs from "fs";
import { drive } from "../config/drive";

export async function uploadImageToDrive(filePath: string, fileName: string): Promise<string> {
    try {
        const fileMetadata: any = {
            name: fileName,
        };

        // Add parent folder if provided via env
        if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
            fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
        }

        const media = {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(filePath),
        };

        // Upload the file
        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            supportsAllDrives: true,   // <- required for Shared Drives
            fields: 'id, webViewLink',
        });

        const fileId = file.data.id;

        if (!fileId) {
            throw new Error("Failed to get uploaded file ID.");
        }

        // Set file permission to public
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,  // <- required for Shared Drives
        });

        // Return a public URL (webViewLink is also available)
        const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        return publicUrl;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}
