import mongoose from 'mongoose';

const processVersionSchema = new mongoose.Schema(
  {
    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Process',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.model('ProcessVersion', processVersionSchema);
