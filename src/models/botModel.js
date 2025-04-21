import mongoose from "mongoose";

const botSchema = new mongoose.Schema(
  {
    botId: {
      type: String,
      required: true,
    },

    userEmail: {
      type: String,
      required: true,
    },

    botName: {
      type: String,
      required: true,
    },
    botUserName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bot = mongoose.model("Bot", botSchema);

export default Bot;
