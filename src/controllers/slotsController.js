import Bot from "../models/botModel.js";
import Slot from "../models/slotModel.js";

export const getSlots = async (req, res) => {
  try {
    const userEmail = req?.user?.email || "parthsali04@gmail.com";
    const bot = await Bot.findOne({ userEmail });

    if (!bot) {
      return res.status(404).json({ error: "Bot not found for this user" });
    }

    const slots = await Slot.find({ botId: bot._id }).populate("bookedBy");
    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createSlots = async (req, res) => {
  try {
    const userEmail = req?.user?.email || "parthsali04@gmail.com";
    const { slotDuration, startTime, endTime } = req.body;

    if (!userEmail || !slotDuration || !startTime || !endTime) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const bot = await Bot.findOne({ userEmail });

    if (!bot) {
      return res.status(404).json({ error: "Bot not found for this user" });
    }

    const slotDurationInMinutes = slotDuration || 30;
    const startTimeStr = startTime || "09:00";
    const endTimeStr = endTime || "17:00";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [startHour, startMinute] = startTimeStr.split(":").map(Number);
    const [endHour, endMinute] = endTimeStr.split(":").map(Number);

    // Set start and end for today
    let start = new Date(today);
    start.setHours(startHour, startMinute, 0, 0);
    let end = new Date(today);
    end.setHours(endHour, endMinute, 0, 0);

    // If start is before now, set start to now (rounded up to next slot)
    const now = new Date();
    if (start < now && now < end) {
      // Round up to next slot boundary
      const minutes = now.getMinutes();
      const remainder =
        slotDurationInMinutes - (minutes % slotDurationInMinutes);
      now.setSeconds(0, 0);
      if (remainder !== slotDurationInMinutes) {
        now.setMinutes(minutes + remainder);
      }
      start = new Date(now);
    }

    // Check if slots already exist for this bot and date
    const existingSlots = await Slot.findOne({
      botId: bot._id,
      startTime: { $gte: today, $lt: end },
    });

    if (existingSlots) {
      return res
        .status(200)
        .json({ message: "Slots already exist for this date" });
    }

    const slots = [];

    for (
      let current = new Date(start);
      current < end;
      current = new Date(current.getTime() + slotDurationInMinutes * 60000)
    ) {
      const slotEnd = new Date(
        current.getTime() + slotDurationInMinutes * 60000
      );
      if (slotEnd > end) break;
      slots.push({
        botId: bot._id,
        startTime: new Date(current),
        endTime: slotEnd,
        isBooked: false,
      });
    }

    if (slots.length === 0) {
      return res.status(200).json({ message: "No slots to create for today" });
    }

    await Slot.insertMany(slots, { ordered: false });
    res.status(201).json({ message: "Slots created successfully" });
  } catch (error) {
    console.error("Error creating slots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    console.log("Deleting slot...");
    const userEmail = req?.user?.email || "parthsali04@gmail.com";

    const { slotId } = req.params;

    if (!slotId) {
      return res.status(400).json({ error: "Slot ID is required" });
    }

    const bot = await Bot.findOne({
      userEmail,
    });

    if (!bot) {
      return res.status(404).json({ error: "Bot not found for this user" });
    }

    const slot = await Slot.findOneAndDelete({
      _id: slotId,
      botId: bot._id,
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.json({ message: "Slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createSlot = async (req, res) => {
  try {
    const userEmail = req?.user?.email || "parthsali04@gmail.com";

    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Start time and end time are required" });
    }

    const bot = await Bot.findOne({
      userEmail,
    });

    if (!bot) {
      return res.status(404).json({ error: "Bot not found for this user" });
    }

    const newSlot = new Slot({
      botId: bot._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isBooked: false,
    });

    await newSlot.save();
    res.status(201).json({ message: "Slot added successfully", slot: newSlot });
  } catch (error) {
    console.error("Error adding slot:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
