import Appointment from "../models/appointmentModel.js";
import WaitingQueue from "../models/waitingQueueModel.js";
import Slot from "../models/slotModel.js";

export async function bookAppointment(userId, ctx) {
  const existing = await Appointment.findOne({ userId }).exec();
  if (existing) {
    await ctx.reply(
      "⚠️ You already have a booking or are in the waiting queue."
    );
    return existing.status;
  }

  const slot = await Slot.findOne({ isAvailable: true }).exec();
  if (slot) {
    slot.isAvailable = false;
    await slot.save();

    // 3b. Persist confirmed appointment
    await Appointment.create({
      userId,
      slotId: slot.slotId,
      status: "confirmed",
    });

    // 3c. Notify user of confirmation
    await ctx.telegram.sendMessage(
      ctx.from.id,
      `✔️ Appointment confirmed for slot ${slot.slotId}.`,
      { parse_mode: "HTML" }
    );

    return "confirmed";
  }

  // 4a. If no slots free, enqueue the user
  await WaitingQueue.create({ userId });
  await Appointment.create({ userId, status: "waiting" });

  // 4b. Notify user of waiting status
  await ctx.telegram.sendMessage(
    ctx.from.id,
    "⏳ All slots are full — you have been added to the waiting queue.",
    { parse_mode: "HTML" }
  );

  return "waiting";
}

export async function cancelAppointment(userId, ctx) {
  // 1. Locate existing appointment
  const appt = await Appointment.findOne({ userId }).exec();
  if (!appt) {
    await ctx.reply("ℹ️ No active appointment found.");
    return null;
  }

  // 2. Delete the Appointment document
  const wasConfirmed = appt.status === "confirmed" && appt.slotId != null;
  await Appointment.deleteOne({ userId }).exec();

  // 3. If confirmed, free up the slot
  if (wasConfirmed) {
    await Slot.updateOne({ slotId: appt.slotId }, { isAvailable: true }).exec();

    // 4. Reassign freed slot to next in queue
    await assignSlotFromWaitingQueue(appt.slotId, ctx);
  }

  // 5. Remove from waiting queue if present
  await WaitingQueue.deleteOne({ userId }).exec();

  // 6. Notify the user
  await ctx.telegram.sendMessage(
    ctx.from.id,
    "❌ Your appointment has been cancelled.",
    { parse_mode: "HTML" }
  );

  return "cancelled";
}

export async function assignSlotFromWaitingQueue(slotId, ctx) {
  // 1. Get next waiting user
  const next = await WaitingQueue.findOne().sort({ requestedAt: 1 }).exec();

  if (!next) return;

  // 2. Mark slot unavailable
  await Slot.updateOne({ slotId }, { isAvailable: false }).exec();

  // 3. Update the user's appointment record
  await Appointment.findOneAndUpdate(
    { userId: next.userId, status: "waiting" },
    { slotId, status: "confirmed" }
  ).exec();

  // 4. Remove from waiting queue
  await WaitingQueue.deleteOne({ userId: next.userId }).exec();

  // 5. Notify the user
  await ctx.telegram.sendMessage(
    next.userId,
    `👍 You've been moved into slot ${slotId}.`,
    { parse_mode: "HTML" }
  );
}
export async function checkUserStatus(userId, ctx) {
  const appt = await Appointment.findOne({ userId }).exec();
  if (!appt) {
    return ctx.reply("ℹ️ You have no appointments.");
  }
  if (appt.status === "confirmed") {
    return ctx.reply(`✅ You're confirmed in slot ${appt.slotId}.`);
  }
  return ctx.reply(`⏳ You're in the waiting queue.`);
}

export async function listAvailableSlots(ctx) {
  const freeSlots = await Slot.find({ isAvailable: true })
    .sort("slotId")
    .exec();
  if (!freeSlots.length) {
    return ctx.reply("🚫 No slots are currently available.");
  }
  const slotList = freeSlots.map((s) => `• Slot ${s.slotId}`).join("\n");
  return ctx.replyWithHTML(`✅ Available slots:\n${slotList}`);
}

export async function getWaitingPosition(userId, ctx) {
  const entry = await WaitingQueue.findOne({ userId }).exec();
  if (!entry) {
    return ctx.reply("ℹ️ You are not in the waiting queue.");
  }
  // Count how many requestedAt is earlier than this user’s
  const position =
    (await WaitingQueue.countDocuments({
      requestedAt: { $lt: entry.requestedAt },
    }).exec()) + 1;
  return ctx.reply(`⏳ Your position in queue is ${position}.`);
}

export async function listAllAppointments(ctx) {
  const all = await Appointment.find().sort({ requestedAt: 1 }).lean().exec();

  if (!all.length) {
    return ctx.reply("ℹ️ No appointments found.");
  }

  const lines = all.map(
    (a) =>
      `• User ${a.userId}: ${a.status}` +
      (a.status === "confirmed" ? ` (Slot ${a.slotId})` : "")
  );
  const message = `<b>All Appointments:</b>\n` + lines.join("\n");
  return ctx.reply(message, { parse_mode: "HTML" });
}

function autoCancelNoShows(thresholdMs, bot) {
  // Schedule: every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    const cutoff = new Date(Date.now() - thresholdMs);
    const stale = await Appointment.find({
      status: "confirmed",
      createdAt: { $lt: cutoff },
    }).exec();
    for (const appt of stale) {
      // pass a dummy ctx with telegram via bot
      const fakeCtx = { from: { id: appt.userId }, telegram: bot.telegram };
      await cancelAppointment(appt.userId, fakeCtx);
    }
  });
}
