const mongoose = require("mongoose");

// Schema for Service
const ServiceSchema = new mongoose.Schema(
  {
    salonId: mongoose.Schema.ObjectId,
    category: {
      type: String,
      lowercase: true,
      required: true,
    },
    serviceTitle: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
    targetGender: {
      type: String,
      lowercase: true,
      required: true,
    },
    avgTime: {
      type: Number,
      required: true,
      default: 1,
    },
    productsUsed: [
      {
        product: { type: mongoose.Schema.ObjectId, ref: "Product" },
        usagePerService: Number,
      },
    ],
    variables: [
      {
        variableType: {
          type: String,
          lowercase: true,
          required: true,
        },
        variableName: {
          type: String,
          lowercase: true,
          required: true,
        },
        variablePrice: {
          type: Number,
          required: true,
          default: 0,
        },
        variableCutPrice: {
          type: Number,
          required: true,
          default: 0,
        },
        variableTime: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    basePrice: {
      type: Number,
    },
    cutPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("Service", ServiceSchema);
