const mongoose = require("mongoose");

// Schema for Salon
const SalonSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    salonType: {
      type: String,
      enum: ["unisex", "male", "female", "not specified"],
      default: "not specified",
      lowercase: true,
      required: true,
    },
    timing: {
      opening: {
        type: String,
        required: true,
      },
      closing: {
        type: String,
        required: true,
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    closedOn: {
      type: String,
      default: "none",
      required: true,
      lowercase: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: function (val) {
          return val.toString().length === 10;
        },
        message: (val) => `${val.value} has to be 10 digits`,
      },
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
    },
    gst: {
      type: String,
      default: "XX-XXXXXXXXX-XX",
    },
    pan: {
      type: String,
      default: "XX-XXXXXXXXX-XX",
    },
    live: {
      type: Boolean,
      default: false,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    bookings: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    links: {
      instagram: {
        type: String,
        default: "",
      },
    },
    images: [
      {
        key: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

SalonSchema.index({ location: "2dsphere" });

module.exports = new mongoose.model("Salon", SalonSchema);
