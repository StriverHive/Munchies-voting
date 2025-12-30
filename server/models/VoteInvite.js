// server/models/VoteInvite.js
const mongoose = require("mongoose");

const voteInviteSchema = new mongoose.Schema(
  {
    vote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vote",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Each employee gets at most one invite per vote
voteInviteSchema.index({ vote: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model("VoteInvite", voteInviteSchema);
