// server/models/VoteCast.js
const mongoose = require("mongoose");

const voteCastSchema = new mongoose.Schema(
  {
    vote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vote",
      required: true,
    },
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // Nominees selected by this voter for this vote
    nominees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

// Ensure a voter can only vote once per vote
voteCastSchema.index({ vote: 1, voter: 1 }, { unique: true });

const VoteCast = mongoose.model("VoteCast", voteCastSchema);

module.exports = VoteCast;
