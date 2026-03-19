// server/routes/voteRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");

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
  getPublicVoteSummary,
  checkEmployeeEligibility,
  castVote,
  sendVoteInvites,
  getInviteDetails,
  castVoteWithInvite,
  sendWinnerSummaryToNominees,
  sendWinnerSummaryToLocation,
  exportVotesCSV,
} = require("../controllers/voteController");

// 🔹 Global winners history – must be BEFORE any `/:id` routes
router.get("/winners/history", requireAuth, getWinnersHistory);

// 🔹 Export votes to CSV – must be BEFORE any `/:id` routes
router.post("/export-csv", requireAuth, exportVotesCSV);

// 🔹 List & create votes
router.get("/", requireAuth, getVotes);
router.post("/", requireAuth, createVote);

// 🔹 Per-vote reporting & winners
router.get("/:id/voters", requireAuth, getVoteVoters);
router.get("/:id/report", requireAuth, getVoteReport);
router.get("/:id/winners", requireAuth, getVoteWinners);
router.get("/:id/official-winners", requireAuth, getOfficialWinners);
router.post("/:id/announce-winner", requireAuth, announceWinner);

// 🔹 Normal voting (with employee ID on form) – PUBLIC
router.get("/:id/public-summary", getPublicVoteSummary);
router.post("/:id/check-employee", checkEmployeeEligibility);
router.post("/:id/cast", castVote);

// 🔹 Invite-based voting
router.post("/:id/send-invites", requireAuth, sendVoteInvites);
router.get("/:id/invite/:token", getInviteDetails); // PUBLIC (invite link)
router.post("/:id/invite/:token/cast", castVoteWithInvite); // PUBLIC

// 🔹 Winner notifications
router.post("/:id/notify-nominees-winners", requireAuth, sendWinnerSummaryToNominees);
router.post("/:id/notify-location-winner", requireAuth, sendWinnerSummaryToLocation);

// 🔹 Update & delete
router.put("/:id", requireAuth, updateVote);
router.delete("/:id", requireAuth, deleteVote);

module.exports = router;
