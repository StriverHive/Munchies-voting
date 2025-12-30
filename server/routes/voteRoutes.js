// server/routes/voteRoutes.js
const express = require("express");
const router = express.Router();

const {
  createVote,
  updateVote,
  deleteVote,
  getVotes,
  getVoteVoters,
  getVoteReport,
  getVoteWinners,
  announceWinner,
  getOfficialWinners,
  getWinnersHistory,
  checkEmployeeEligibility,
  castVote,
  sendVoteInvites,
  getInviteDetails,
  castVoteWithInvite,
  sendWinnerSummaryToNominees,
  sendWinnerSummaryToLocation, // ✅ NEW
} = require("../controllers/voteController");

// 🔹 Global winners history – must be BEFORE any `/:id` routes
router.get("/winners/history", getWinnersHistory);

// 🔹 List & create votes
router.get("/", getVotes);
router.post("/", createVote);

// 🔹 Per-vote reporting & winners
router.get("/:id/voters", getVoteVoters);
router.get("/:id/report", getVoteReport);
router.get("/:id/winners", getVoteWinners);
router.get("/:id/official-winners", getOfficialWinners);
router.post("/:id/announce-winner", announceWinner);

// 🔹 Normal voting (with employee ID on form)
router.post("/:id/check-employee", checkEmployeeEligibility);
router.post("/:id/cast", castVote);

// 🔹 Invite-based voting
router.post("/:id/send-invites", sendVoteInvites);
router.get("/:id/invite/:token", getInviteDetails);
router.post("/:id/invite/:token/cast", castVoteWithInvite);

// 🔹 Winner notifications
router.post("/:id/notify-nominees-winners", sendWinnerSummaryToNominees); // global (existing)
router.post("/:id/notify-location-winner", sendWinnerSummaryToLocation);  // ✅ per-store (new)

// 🔹 Update & delete
router.put("/:id", updateVote);
router.delete("/:id", deleteVote);

module.exports = router;
