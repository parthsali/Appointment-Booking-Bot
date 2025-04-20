import { Markup } from "telegraf";
import Slot from "../models/slotModel.js";

export const viewSlotsCallback = async (ctx) => {};

export const bookSlotCallback = async (ctx) => {
  const botId = String(ctx.botInfo.id);
  const slots = await Slot.find({
    botId,
    isBooked: false,
  }).exec();

  if (slots.length === 0) {
    await ctx.editMessageText("No available slots found.");
    return;
  }

  await ctx.editMessageText(
    "Available slots:",
    Markup.inlineKeyboard(
      slots.map((slot) => [
        Markup.button.callback(
          `${new Date(slot.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })} - ${new Date(slot.endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`,
          `book_slot_${slot._id}`
        ),
      ])
    )
  );
};

export const bootSlotWithIdCallback = async (ctx) => {
  const contactId = ctx.from.id;

  const slotId = ctx.callbackQuery.data.split("_")[2];

  const slot = await Slot.findById(slotId).exec();

  if (!slot) {
    await ctx.editMessageText("Slot not found.");
    return;
  }

  if (slot.isBooked) {
    await ctx.editMessageText("Slot is already booked.");
    return;
  }

  // Mark the slot as booked
  slot.isBooked = true;

  await slot.save();

  await ctx.editMessageText(
    `You have booked the slot from ${new Date(
      slot.startTime
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })} to ${new Date(slot.endTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`
  );
};

export const cancelSlotCallback = async (ctx) => {
  const userId = ctx.from.id;
  console.log("calling cancelSlotCallback", userId);
  await ctx.editMessageText("Cancelling a slot...");
};

export const helpCallback = async (ctx) => {
  const userId = ctx.from.id;
  console.log("calling helpCallback", userId);
  await ctx.editMessageText("Fetching help information...");
};
