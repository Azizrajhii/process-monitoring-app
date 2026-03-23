import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    process: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Process',
      required: true,
    },
    type: {
      type: String,
      enum: ['cpk_low', 'limit_exceeded', 'trend_anomaly'],
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['treated', 'not_treated'],
      default: 'not_treated',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Alert', alertSchema);
