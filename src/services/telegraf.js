import { Telegraf } from "telegraf";
import { TELEGRAM_BOT_TOKEN } from "../config/config.js";
import {
  listAvailableSlots,
  getWaitingPosition,
  listAllAppointments,
} from "./appointment.js";
import { commands } from "../constants/commands.js";
import {
  startController,
  initializeSlots,
} from "../controllers/botController.js";

import {
  bookSlotCallback,
  bootSlotWithIdCallback,
  cancelSlotCallback,
  helpCallback,
} from "../controllers/callbacks.js";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.telegram.setMyCommands(commands);

bot.start(startController);

// bot.command("initialize", initializeSlots);

// register callback handlers
// bot.action("view_slots", viewSlotsCallback);
bot.action("book_slot", bookSlotCallback);
bot.action("cancel_slot", cancelSlotCallback);
bot.action("help", helpCallback);

// book slot callback
bot.action(/book_slot_(\d+)/, bootSlotWithIdCallback);

bot.command("initialize", (ctx) => {
  const slots = initializeSlots(10); // Initialize with 10 slots
  ctx.reply(`Initialized ${slots.length} slots.`);
});

bot.command("list_slots", (ctx) => {
  listAvailableSlots(ctx).catch((err) => {
    console.error("Error listing slots:", err);
    ctx.reply("An error occurred while listing slots.");
  });
});

bot.command("waiting_position", (ctx) => {
  const userId = ctx.from.id;
  getWaitingPosition(userId, ctx).catch((err) => {
    console.error("Error getting waiting position:", err);
    ctx.reply("An error occurred while getting your waiting position.");
  });
});

bot.command("list_appointments", (ctx) => {
  listAllAppointments(ctx).catch((err) => {
    console.error("Error listing appointments:", err);
    ctx.reply("An error occurred while listing appointments.");
  });
});
