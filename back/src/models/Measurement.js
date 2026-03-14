const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema({

  value: {
    type: Number,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  process: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Process",
    required: true
  }

});

module.exports = mongoose.model("Measurement", measurementSchema);
