import express from "express";
import cors from "cors";
import { bot } from "./services/telegraf.js";

const app = express();

app.use(cors());
app.use(express.json());

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default app;
