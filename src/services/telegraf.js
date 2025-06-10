import { Telegraf } from "telegraf";
import { TELEGRAM_BOT_TOKEN } from "../config/config.js";

import { commands } from "../constants/commands.js";
import {
  startController,
  helpController,
  initializeSlots,
  deleteSlots,
  handleBotMessage,
} from "../controllers/botController.js";

import {
  bookSlotCallback,
  bootSlotWithIdCallback,
  cancelSlotCallback,
  appointmentDetailsCallback,
  backToStartMenuCallback,
  helpCallback,
  confirmCancelSlotCallback,
  attendCallback,
} from "../controllers/callbacks.js";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.telegram.setMyCommands(commands);

bot.start((ctx) => startController(ctx, bot));
bot.help(helpController);

// commands
// bot.command("initialize", initializeSlots);

bot.command("delete_slots", deleteSlots);

bot.on("message", handleBotMessage);
// callbacks
bot.action("book_slot", bookSlotCallback);
bot.action(/book_slot_(\d+)/, bootSlotWithIdCallback);

bot.action("cancel_slot", cancelSlotCallback);
bot.action(/confirm_cancel_(\d+)/, confirmCancelSlotCallback);

bot.action(/attend_(\d+)/, attendCallback);

bot.action("appointment_details", appointmentDetailsCallback);

bot.action("help", helpCallback);

bot.action("back_to_start_menu", backToStartMenuCallback);
