// server/models/Vote.js
const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    announcedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const voteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    locations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required: true,
      },
    ],

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],

    nominees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],

    votePoints: { type: Number, default: 1, min: 1 },
    maxVotesPerVoter: { type: Number, default: 1, min: 1 },

    // Official winners selected per store for this vote
    winners: [winnerSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vote", voteSchema);
