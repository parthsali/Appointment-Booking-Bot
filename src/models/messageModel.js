import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["Service", "Authentication", "Utility", "Marketing"],
      default: "Service",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    timestamp: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
    },
    mediaUrl: { type: String, default: null },
    templateId: { type: String, default: null },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
