import mongoose from "mongoose";

const contactSchema = mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    contactNo: {
      type: String,
      required: true,
    },
    businessEmail: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      required: true,
      default: "India",
    },
    city: {
      type: String,
      required: true,
      default: "Delhi",
    },
    subscribed: {
      type: Boolean,
      default: true, // "No" should be "false"
    },
  },
  {
    timestamps: true,
  }
);

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
