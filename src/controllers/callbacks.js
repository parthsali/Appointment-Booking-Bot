import { Markup } from "telegraf";
import Slot from "../models/slotModel.js";
import Contact from "../models/contactMode.js";
import WaitingQueue from "../models/waitingQueueModel.js";

export const bookSlotCallback = async (ctx) => {
  const botId = String(ctx.botInfo.id);

  const telegramId = String(ctx.from.id);

  const contact = await Contact.findOne({ telegramId }).exec();

  if (!contact) {
    await ctx.editMessageText("Contact not found. Please register first.");
    return;
  }

  const slot = await Slot.findOne({
    botId,
    bookedBy: contact._id,
    isBooked: true,
  }).exec();

  if (slot) {
    await ctx.editMessageText(
      `You have already booked a slot from ${new Date(
        slot.startTime
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })} to ${new Date(slot.endTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Back", callback_data: "back_to_start_menu" }],
          ],
        },
      }
    );
    return;
  }

  const slots = await Slot.find({
    botId,
    isBooked: false,
  }).exec();

  if (slots.length === 0) {
    // add contact to waiting queue
    const waitingQueue = new WaitingQueue({
      contactId: contact._id,
      requestedAt: new Date(),
    });
    await waitingQueue.save();
    await ctx.editMessageText(
      "No available slots found.\nYou have been added to the waiting queue."
    );
    return;
  }

  await ctx.editMessageText(
    "Available slots:",
    Markup.inlineKeyboard([
      ...slots.map((slot) => [
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
      ]),
      [Markup.button.callback("Back", "back_to_start_menu")],
    ])
  );
};

export const bootSlotWithIdCallback = async (ctx) => {
  const telegramId = String(ctx.from.id);

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

  const contact = await Contact.findOne({ telegramId: telegramId }).exec();

  if (!contact) {
    await ctx.editMessageText("Contact not found. Please register first.");
    return;
  }

  // Mark the slot as booked
  slot.isBooked = true;
  slot.bookedBy = contact._id;

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
  const telegramId = String(ctx.from.id);
  const botId = String(ctx.botInfo.id);

  const contact = await Contact.findOne({ telegramId }).exec();

  if (!contact) {
    await ctx.editMessageText("Contact not found. Please register first.");
    return;
  }

  const slot = await Slot.findOne({
    botId,
    bookedBy: contact._id,
    isBooked: true,
  }).exec();

  if (!slot) {
    await ctx.editMessageText("No booked slot found.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back_to_start_menu" }],
        ],
      },
    });
    return;
  }

  // add confirm button to cancel the slot and back button

  await ctx.editMessageText(
    `Are you sure you want to cancel the slot from ${new Date(
      slot.startTime
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })} to ${new Date(slot.endTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}?`,

    Markup.inlineKeyboard([
      [
        Markup.button.callback("Yes", `confirm_cancel_${slot._id}`),
        Markup.button.callback("No", "back_to_start_menu"),
      ],
    ])
  );
};

export const confirmCancelSlotCallback = async (ctx) => {
  const telegramId = String(ctx.from.id);
  const botId = String(ctx.botInfo.id);
  const slotId = ctx.callbackQuery.data.split("_")[2];

  const contact = await Contact.findOne({ telegramId }).exec();

  if (!contact) {
    await ctx.editMessageText("Contact not found. Please register first.");
    return;
  }

  const slot = await Slot.findOne({
    botId,
    bookedBy: contact._id,
    isBooked: true,
  }).exec();

  if (!slot) {
    await ctx.editMessageText("Slot not found.");
    return;
  }

  const waitingContact = await WaitingQueue.findOne()
    .sort({ requestedAt: 1 })
    .exec();

  if (waitingContact) {
    slot.bookedBy = waitingContact.contactId;
    slot.isBooked = true;

    await slot.save();

    // Remove the contact from the waiting queue
    await WaitingQueue.deleteOne({ _id: waitingContact._id });

    // Notify the contact

    const contact = await Contact.findById(waitingContact.contactId);

    if (contact) {
      await ctx.telegram.sendMessage(
        contact.telegramId,
        `A slot has become available and has been assigned to you. The slot is from ${new Date(
          slot.startTime
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })} to ${new Date(slot.endTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}.`
      );

      await ctx.editMessageText(`Slot cancelled successfully.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Back", callback_data: "back_to_start_menu" }],
          ],
        },
      });
    }
    return;
  }

  slot.isBooked = false;
  slot.bookedBy = null;

  await slot.save();

  await ctx.editMessageText("Slot cancelled successfully.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Back", callback_data: "back_to_start_menu" }],
      ],
    },
  });
};

export const appointmentDetailsCallback = async (ctx) => {
  const telegramId = String(ctx.from.id);
  const botId = String(ctx.botInfo.id);

  const contact = await Contact.findOne({ telegramId }).exec();

  if (!contact) {
    await ctx.editMessageText("Contact not found. Please register first.");
    return;
  }

  const slot = await Slot.findOne({
    botId,
    bookedBy: contact._id,
    isBooked: true,
  }).exec();

  if (!slot) {
    await ctx.editMessageText("You have no booked slots.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back_to_start_menu" }],
        ],
      },
    });
    return;
  }

  await ctx.editMessageText(
    `Your booked slot is from ${new Date(slot.startTime).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    )} to ${new Date(slot.endTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back_to_start_menu" }],
        ],
      },
    }
  );
};

export const backToStartMenuCallback = async (ctx) => {
  const userId = ctx.from.id;
  console.log("calling backToStartMenuCallback", userId);
  await ctx.editMessageText("Please select an option:", {
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
};

export const helpCallback = async (ctx) => {
  const userId = ctx.from.id;
  console.log("calling helpCallback", userId);
  await ctx.editMessageText(
    "Here are the available commands:\n\n" +
      "1. Book Slot: Allows you to book an available slot.\n" +
      "2. Cancel Slot: Cancel your currently booked slot.\n" +
      "3. Appointment Details: View details of your booked slot.\n" +
      "4. Help: Display this help message.\n\n" +
      "Use the buttons below to navigate through the options.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back_to_start_menu" }],
        ],
      },
    }
  );
};

export const attendCallback = async (ctx) => {
  const telegramId = String(ctx.from.id);
  const botId = String(ctx.botInfo.id);
  const callbackData = ctx.callbackQuery.data;
  const isAttending = callbackData.startsWith("attend");
  const slotId = callbackData.split("_")[1];

  const contact = await Contact.findOne({ telegramId }).exec();

  if (!contact) {
    await ctx.editMessageText("Contact not found. Please register first.");
    return;
  }

  const slot = await Slot.findOne({
    botId,
    bookedBy: contact._id,
    isBooked: true,
  }).exec();

  if (!slot) {
    await ctx.editMessageText("Slot not found.");
    return;
  }

  if (isAttending) {
    await ctx.editMessageText("Thank you for confirming your attendance.");
  } else {
    await ctx.editMessageText("Thank you for confirming your non-attendance.");

    slot.isBooked = false;
    slot.bookedBy = null;
    await slot.save();

    const waitingContact = await WaitingQueue.findOne()
      .sort({ requestedAt: 1 })
      .exec();

    if (waitingContact) {
      console.log("inside waiting queue");
      slot.bookedBy = waitingContact.contactId;
      slot.isBooked = true;

      await slot.save();

      await WaitingQueue.deleteOne({ _id: waitingContact._id });

      const waitingContactDetails = await Contact.findById(
        waitingContact.contactId
      ).exec();

      if (waitingContactDetails) {
        await ctx.telegram.sendMessage(
          waitingContactDetails.telegramId,
          `A slot has become available and has been assigned to you. The slot is from ${new Date(
            slot.startTime
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })} to ${new Date(slot.endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}.`
        );
      }
    }
  }
};
