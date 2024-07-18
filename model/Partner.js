const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

function toLower(val) {
  return val.toLowerCase();
}

// Schema for Partners
const PartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: Number,
      unique: true,
      required: true,
      validate: {
        validator: function (val) {
          return val.toString().length === 10;
        },
        message: (val) => `${val.value} has to be 10 digits`,
      },
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      default: process.env.NULL_OBJECT_ID,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer not to say"],
      set: toLower,
      default: "prefer not to say",
    },
    admin: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    commission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
    },
  },
  {
    timestamps: true,
  }
);

PartnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

module.exports = new mongoose.model("Partner", PartnerSchema);
