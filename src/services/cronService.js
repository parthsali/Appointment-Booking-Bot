import { CronJob } from "cron";
import Slot from "../models/slotModel.js";
import { bot } from "./telegraf.js";

async function sendReminder() {
  const currentDate = new Date();
  const currentTime = currentDate.getTime();

  const slots = await Slot.find({
    reminderSent: false,
    startTime: {
      $gte: currentTime,
      $lte: currentTime + 60 * 60 * 1000,
    },
    bookedBy: { $ne: null },
  }).populate("bookedBy", "telegramId");

  if (slots.length === 0) {
    console.log("No slots found for reminders.");
    return;
  }

  for (const slot of slots) {
    const formattedDate = new Date(slot.startTime).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await bot.telegram.sendMessage(
      slot.bookedBy.telegramId,
      `Reminder: You have a slot scheduled on ${formattedDate}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Yes, I will attend",
                callback_data: `attend_${slot._id}`,
              },
              {
                text: "No, I won't attend",
                callback_data: `not_attend_${slot._id}`,
              },
            ],
          ],
        },
      }
    );
    slot.reminderSent = true;
    await slot.save();
  }

  console.log("Reminders sent for upcoming slots.");
}

async function deleteExpiredSlots() {
  // delete slots at each midnight
  const currentDate = new Date();
  const currentTime = currentDate.getTime();

  await Slot.deleteMany({
    startTime: { $lt: currentTime },
  });

  console.log("Expired slots deleted.");
}

export const remindersJob = new CronJob(
  // should run every 1 minute
  "*/1 * * * *",
  sendReminder,
  null,
  true
);

export const deleteExpiredSlotsJob = new CronJob(
  // should run every day at midnight
  "0 0 * * *",
  deleteExpiredSlots,
  null,
  true
);

export const startCronJob = () => {
  remindersJob.start();
  deleteExpiredSlotsJob.start();
  console.log("Cron job started.");
};
