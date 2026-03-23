import mongoose from 'mongoose';

const correctiveActionSchema = new mongoose.Schema(
  {
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    result: {
      type: String,
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

export default mongoose.model('CorrectiveAction', correctiveActionSchema);
