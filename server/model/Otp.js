import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: [true, "Otp code is required"],
      unique: [true, "Otp code already exists"],
    },
    email: {
        type: String,
        required: [true, "email address is required"],
      },
    accountType: {
      type: String,
      required: [true, "Account type is required"],
    },
    createdAt:{
        type: Date,
        default: () => Date.now(),
        expires: 3600 //1Hour
    }
  },
  { timestamps: true }
);

const OtpModel = mongoose.model("otp", OtpSchema);
export default OtpModel;
