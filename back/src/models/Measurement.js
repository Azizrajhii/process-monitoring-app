import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    process: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Process',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Measurement', measurementSchema);
