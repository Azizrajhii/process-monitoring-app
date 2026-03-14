const mongoose = require("mongoose");

const correctiveActionSchema = new mongoose.Schema({

  alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alert",
    required: true
  },

  description: {
    type: String,
    required: true
  },

  responsible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  result: {
    type: String
  },

  date: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("CorrectiveAction", correctiveActionSchema);
