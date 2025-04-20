import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
});

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;
