import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    contactNo: {
      type: Number,
      unique: true,
    },
    access_token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessToken",
    },
    phone_number_id: {
      type: String,
      default: null,
    },
    waba_id: {
      type: String,
      default: null,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Gold", "Platinum", "Custom"],
      default: "Free",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    analytics: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analytic",
    },
    templates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Template",
      },
    ],
    broadcasts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BroadCast",
      },
    ],
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
