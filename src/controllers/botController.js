import { Markup } from "telegraf";
import Slot from "../models/slotModel.js";
import Contact from "../models/contactMode.js";
import { bot } from "../services/telegraf.js";

export async function startController(ctx) {
  const botId = ctx.botInfo.id;
  const telegramId = ctx.from.id;
  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name || "";

  const contact = await Contact.findOne({ telegramId }).exec();

  if (contact) {
    await ctx.reply(`Welcome back, ${contact.name}!`);

    await ctx.reply("Please select an option:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Book Slot", callback_data: "book_slot" }],
          [{ text: "Cancel Slot", callback_data: "cancel_slot" }],
          [
            {
              text: "Details about appointment",
              callback_data: "appointment_details",
            },
          ],
          [{ text: "Help", callback_data: "help" }],
        ],
      },
    });

    return;
  }

  bot.telegram.sendMessage(
    telegramId,
    "Please share your contact number.",
    Markup.keyboard([[Markup.button.contactRequest("Share Contact")]])
      .oneTime()
      .resize()
  );

  bot.on("contact", async (ctx) => {
    const contact = ctx.message.contact;
    const phoneNumber = contact.phone_number;
    const telegramId = contact.user_id;

    const newContact = new Contact({
      telegramId: telegramId,
      name: `${ctx.from.first_name} ${ctx.from.last_name || ""}`,
      contactNo: `+${phoneNumber}`,
    });

    await newContact.save();

    await ctx.reply("Contact saved successfully.", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await ctx.reply("Type /start to start the bot.");
  });
}

export async function initializeSlots(ctx, slotDuration, startTime, endTime) {
  const botId = ctx.botInfo.id;
  const slotDurationInMinutes = slotDuration || 30; // Default to 60 minutes if not provided
  const startTimeStr = startTime || "09:00"; // Default start time
  const endTimeStr = endTime || "17:00"; // Default end time

  const today = new Date();
  const [startHour, startMinute] = startTimeStr.split(":").map(Number);
  const [endHour, endMinute] = endTimeStr.split(":").map(Number);

  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    startHour,
    startMinute
  );
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    endHour,
    endMinute
  );

  const slots = [];

  for (
    let current = new Date(start);
    current < end;
    current = new Date(current.getTime() + slotDurationInMinutes * 60000)
  ) {
    const slotEnd = new Date(current.getTime() + slotDurationInMinutes * 60000);
    slots.push({
      botId,
      startTime: current,
      endTime: slotEnd,
      isBooked: false,
    });
  }

  try {
    await Slot.insertMany(slots, { ordered: false });
    await ctx.reply("Slots initialized successfully.");
  } catch (error) {
    console.error("Error inserting slots:", error);
    await ctx.reply("Failed to initialize slots. Please try again later.");
  }
}

export async function deleteSlots(ctx) {
  const botId = ctx.botInfo.id;

  const deletedSlots = await Slot.deleteMany({ botId });
  await ctx.reply(`${deletedSlots.deletedCount} slots deleted successfully.`);
}

export async function helpController(ctx) {
  await ctx.reply(
    "Welcome to the bot! Here are the available commands and features:\n" +
      "/start - Start the bot and register your contact information.\n" +
      "/help - Get assistance and learn about the bot's features.\n\n" +
      "Features:\n" +
      "- Book Slot: Schedule an appointment.\n" +
      "- Cancel Slot: Cancel an existing appointment.\n" +
      "- Appointment Details: View details about your appointments."
  );
}

export async function handleBotMessage(ctx) {
  const message = ctx.message.text;

  if (message.startsWith("init_slots")) {
    console.log(message);
    const [_, startTime, endTime, slotDuration] = message.split("-");
    await initializeSlots(ctx, slotDuration, startTime, endTime);
    return;
  }
}
