import mongoose from 'mongoose';

const processSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    productionLine: {
      type: String,
      required: true,
    },
    cpTarget: {
      type: Number,
      default: 1.33,
    },
    cpkTarget: {
      type: Number,
      default: 1.33,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Process', processSchema);
