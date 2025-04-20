import mongoose from "mongoose";

const waitingQueueSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
  },
  requestedAt: { type: Date, default: Date.now },
});

const WaitingQueue = mongoose.model("WaitingQueue", waitingQueueSchema);

export default WaitingQueue;
