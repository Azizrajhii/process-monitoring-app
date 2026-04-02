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
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Measurement', measurementSchema);
