import { Telegraf } from "telegraf";
import { TELEGRAM_BOT_TOKEN } from "../config/config.js";

import { commands } from "../constants/commands.js";
import {
  startController,
  initializeSlots,
} from "../controllers/botController.js";

import {
  bookSlotCallback,
  bootSlotWithIdCallback,
  cancelSlotCallback,
  appointmentDetailsCallback,
  backToStartMenuCallback,
  helpCallback,
  confirmCancelSlotCallback,
} from "../controllers/callbacks.js";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.telegram.setMyCommands(commands);

bot.start(startController);

bot.command("initialize", initializeSlots);

bot.action("book_slot", bookSlotCallback);
bot.action(/book_slot_(\d+)/, bootSlotWithIdCallback);

bot.action("cancel_slot", cancelSlotCallback);
bot.action(/confirm_cancel_(\d+)/, confirmCancelSlotCallback);

bot.action("appointment_details", appointmentDetailsCallback);
bot.action("help", helpCallback);

bot.action("back_to_start_menu", backToStartMenuCallback);
