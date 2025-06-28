import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/bot"; // only import this ONCE for side-effect

dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || '';
const APP_ORIGIN = process.env.APP_ORIGIN || '';

// Middlewares
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(cors({ origin: APP_ORIGIN, credentials: true }));
app.use(cookieParser());

// Test route
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ status: "success" });
});

// Start Telegram bot + handlers
import "../src/config/bot";        // starts bot polling
import "./service/messageHandler"; // registers bot commands
import "../src/config/sheets";
import "../src/config/drive";

// Start server
const port: number = parseInt(PORT, 10);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
