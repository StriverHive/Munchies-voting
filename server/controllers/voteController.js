// server/controllers/voteController.js
const crypto = require("crypto");
const Vote = require("../models/Vote");
const VoteCast = require("../models/VoteCast");
const Location = require("../models/Location");
const Employee = require("../models/Employee");
const VoteInvite = require("../models/VoteInvite");
const { sendEmail } = require("../utils/emailService");

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:3000";

// Normalize array of IDs (strings) and remove duplicates
const normalizeIdArray = (value) => {
  if (!Array.isArray(value)) return [];
  const cleaned = value.map((id) => String(id).trim()).filter((id) => !!id);
  return [...new Set(cleaned)];
};

// Helper: compute stats for a vote and its casts
const computeVoteStats = (vote, voteCasts) => {
  const totalVoters = Array.isArray(vote.voters) ? vote.voters.length : 0;
  const totalBallots = voteCasts.length;
  let totalSelections = 0;

  // Map of locations
  const locationMap = new Map();
  vote.locations.forEach((loc) => {
    locationMap.set(String(loc._id), loc);
  });

  // Stats per nominee
  const nomineeStatsMap = new Map();
  vote.nominees.forEach((nominee) => {
    const nomineeLocations =
      (nominee.locations || []).filter((loc) => locationMap.has(String(loc._id))) || [];

    nomineeStatsMap.set(String(nominee._id), {
      _id: nominee._id,
      firstName: nominee.firstName,
      lastName: nominee.lastName,
      employeeId: nominee.employeeId,
      locations: nomineeLocations,
      totalVotes: 0,
      totalPoints: 0,
      percentage: 0,
      _votesByLocationMap: {}, // locationId -> count
    });
  });

  // Count votes
  voteCasts.forEach((cast) => {
    if (!cast.nominees || cast.nominees.length === 0) return;

    totalSelections += cast.nominees.length;

    cast.nominees.forEach((nominee) => {
      const key = String(nominee._id);
      const stat = nomineeStatsMap.get(key);
      if (!stat) return;

      stat.totalVotes += 1;

      const nomineeLocations =
        (nominee.locations || []).filter((loc) => locationMap.has(String(loc._id))) || [];

      nomineeLocations.forEach((loc) => {
        const locIdStr = String(loc._id);
        if (!stat._votesByLocationMap[locIdStr]) {
          stat._votesByLocationMap[locIdStr] = 0;
        }
        stat._votesByLocationMap[locIdStr] += 1;
      });
    });
  });

  // Location summary
  const locationSummaryMap = new Map();
  vote.locations.forEach((loc) => {
    locationSummaryMap.set(String(loc._id), {
      locationId: String(loc._id),
      name: loc.name,
      code: loc.code,
      totalNomineeVotes: 0,
    });
  });

  nomineeStatsMap.forEach((stat) => {
    Object.entries(stat._votesByLocationMap).forEach(([locId, count]) => {
      const locSummary = locationSummaryMap.get(locId);
      if (locSummary) {
        locSummary.totalNomineeVotes += count;
      }
    });
  });

  const votePoints = vote.votePoints || 1;

  const nominees = Array.from(nomineeStatsMap.values()).map((stat) => {
    const votesByLocation = Object.entries(stat._votesByLocationMap)
      .map(([locId, count]) => {
        const loc = locationMap.get(locId);
        if (!loc) return null;
        return {
          locationId: String(loc._id),
          name: loc.name,
          code: loc.code,
          votes: count,
        };
      })
      .filter(Boolean);

    const percentage = totalSelections > 0 ? (stat.totalVotes / totalSelections) * 100 : 0;

    return {
      _id: stat._id,
      firstName: stat.firstName,
      lastName: stat.lastName,
      employeeId: stat.employeeId,
      locations: stat.locations,
      totalVotes: stat.totalVotes,
      totalPoints: stat.totalVotes * votePoints,
      percentage,
      votesByLocation,
    };
  });

  const locationSummary = Array.from(locationSummaryMap.values());

  return {
    voteMeta: {
      _id: vote._id,
      name: vote.name,
      startAt: vote.startAt,
      endAt: vote.endAt,
      locations: vote.locations,
      votePoints: vote.votePoints,
      maxVotesPerVoter: vote.maxVotesPerVoter,
      totalVoters,
      totalBallots,
      totalSelections,
    },
    nominees,
    locationSummary,
    raw: {
      nomineeStatsMap,
      locationMap,
      locationSummaryMap,
      totalSelections,
      votePoints,
    },
  };
};

/* -----------------------------
   POST /api/votes
   Create a vote
   ----------------------------- */
const createVote = async (req, res) => {
  try {
    let {
      name,
      locationIds,
      startAt,
      endAt,
      voterIds,
      nomineeIds,
      votePoints,
      maxVotesPerVoter,
    } = req.body;

    if (
      !name ||
      !locationIds ||
      !startAt ||
      !endAt ||
      !voterIds ||
      !nomineeIds ||
      votePoints == null ||
      maxVotesPerVoter == null
    ) {
      return res.status(400).json({
        message:
          "Name, locations, start/end time, voters, nominees, vote points and max votes per voter are required",
      });
    }

    name = String(name).trim();

    const locationIdList = normalizeIdArray(locationIds);
    const voterIdList = normalizeIdArray(voterIds);
    const nomineeIdList = normalizeIdArray(nomineeIds);

    const vp = Number(votePoints);
    const maxVotes = Number(maxVotesPerVoter);

    if (!name) {
      return res.status(400).json({
        message: "Vote name cannot be empty",
      });
    }

    if (locationIdList.length === 0 || voterIdList.length === 0 || nomineeIdList.length === 0) {
      return res.status(400).json({
        message: "At least one location, one voter and one nominee must be selected",
      });
    }

    if (!Number.isFinite(vp) || vp < 1) {
      return res.status(400).json({
        message: "Vote points must be a positive number",
      });
    }

    if (!Number.isFinite(maxVotes) || maxVotes < 1) {
      return res.status(400).json({
        message: "Max votes per voter must be at least 1",
      });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid start or end date/time",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    // Validate locations
    const locations = await Location.find({
      _id: { $in: locationIdList },
    });

    if (locations.length !== locationIdList.length) {
      return res.status(400).json({
        message: "One or more selected locations do not exist",
      });
    }

    // Validate voters & nominees
    const voters = await Employee.find({
      _id: { $in: voterIdList },
    }).populate("locations", "name code");

    if (voters.length !== voterIdList.length) {
      return res.status(400).json({
        message: "One or more selected voters do not exist",
      });
    }

    const nominees = await Employee.find({
      _id: { $in: nomineeIdList },
    }).populate("locations", "name code");

    if (nominees.length !== nomineeIdList.length) {
      return res.status(400).json({
        message: "One or more selected nominees do not exist",
      });
    }

    const locationSet = new Set(locationIdList);

    // Voters must belong to selected locations
    const invalidVoter = voters.find((voter) => {
      if (!voter.locations || voter.locations.length === 0) return true;
      return !voter.locations.some((loc) => locationSet.has(String(loc._id)));
    });

    if (invalidVoter) {
      return res.status(400).json({
        message: "One or more voters are not assigned to the selected locations",
      });
    }

    // Nominees must belong to selected locations
    const invalidNominee = nominees.find((nominee) => {
      if (!nominee.locations || nominee.locations.length === 0) return true;
      return !nominee.locations.some((loc) => locationSet.has(String(loc._id)));
    });

    if (invalidNominee) {
      return res.status(400).json({
        message: "One or more nominees are not assigned to the selected locations",
      });
    }

    const vote = await Vote.create({
      name,
      locations: locationIdList,
      startAt: start,
      endAt: end,
      voters: voterIdList,
      nominees: nomineeIdList,
      votePoints: vp,
      maxVotesPerVoter: maxVotes,
    });

    const saved = await Vote.findById(vote._id).populate("locations", "name code");

    return res.status(201).json({
      message: "Vote created successfully",
      vote: saved,
    });
  } catch (error) {
    console.error("Create vote error:", error);
    return res.status(500).json({
      message: "Server error while creating vote",
    });
  }
};

/* -----------------------------
   PUT /api/votes/:id
   Update an existing vote
   ----------------------------- */
const updateVote = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      locationIds,
      startAt,
      endAt,
      voterIds,
      nomineeIds,
      votePoints,
      maxVotesPerVoter,
    } = req.body;

    const vote = await Vote.findById(id);
    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    if (
      !name ||
      !locationIds ||
      !startAt ||
      !endAt ||
      !voterIds ||
      !nomineeIds ||
      votePoints == null ||
      maxVotesPerVoter == null
    ) {
      return res.status(400).json({
        message:
          "Name, locations, start/end time, voters, nominees, vote points and max votes per voter are required",
      });
    }

    name = String(name).trim();

    const locationIdList = normalizeIdArray(locationIds);
    const voterIdList = normalizeIdArray(voterIds);
    const nomineeIdList = normalizeIdArray(nomineeIds);

    const vp = Number(votePoints);
    const maxVotes = Number(maxVotesPerVoter);

    if (!name) {
      return res.status(400).json({
        message: "Vote name cannot be empty",
      });
    }

    if (locationIdList.length === 0 || voterIdList.length === 0 || nomineeIdList.length === 0) {
      return res.status(400).json({
        message: "At least one location, one voter and one nominee must be selected",
      });
    }

    if (!Number.isFinite(vp) || vp < 1) {
      return res.status(400).json({
        message: "Vote points must be a positive number",
      });
    }

    if (!Number.isFinite(maxVotes) || maxVotes < 1) {
      return res.status(400).json({
        message: "Max votes per voter must be at least 1",
      });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid start or end date/time",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    // Validate locations
    const locations = await Location.find({
      _id: { $in: locationIdList },
    });

    if (locations.length !== locationIdList.length) {
      return res.status(400).json({
        message: "One or more selected locations do not exist",
      });
    }

    // Validate voters & nominees
    const voters = await Employee.find({
      _id: { $in: voterIdList },
    }).populate("locations", "name code");

    if (voters.length !== voterIdList.length) {
      return res.status(400).json({
        message: "One or more selected voters do not exist",
      });
    }

    const nominees = await Employee.find({
      _id: { $in: nomineeIdList },
    }).populate("locations", "name code");

    if (nominees.length !== nomineeIdList.length) {
      return res.status(400).json({
        message: "One or more selected nominees do not exist",
      });
    }

    const locationSet = new Set(locationIdList);

    const invalidVoter = voters.find((voter) => {
      if (!voter.locations || voter.locations.length === 0) return true;
      return !voter.locations.some((loc) => locationSet.has(String(loc._id)));
    });

    if (invalidVoter) {
      return res.status(400).json({
        message: "One or more voters are not assigned to the selected locations",
      });
    }

    const invalidNominee = nominees.find((nominee) => {
      if (!nominee.locations || nominee.locations.length === 0) return true;
      return !nominee.locations.some((loc) => locationSet.has(String(loc._id)));
    });

    if (invalidNominee) {
      return res.status(400).json({
        message: "One or more nominees are not assigned to the selected locations",
      });
    }

    // Apply updates (do not touch winners or past casts here)
    vote.name = name;
    vote.locations = locationIdList;
    vote.startAt = start;
    vote.endAt = end;
    vote.voters = voterIdList;
    vote.nominees = nomineeIdList;
    vote.votePoints = vp;
    vote.maxVotesPerVoter = maxVotes;

    await vote.save();

    const saved = await Vote.findById(vote._id).populate("locations", "name code");

    return res.json({
      message: "Vote updated successfully",
      vote: saved,
    });
  } catch (error) {
    console.error("Update vote error:", error);
    return res.status(500).json({
      message: "Server error while updating vote",
    });
  }
};

/* -----------------------------
   DELETE /api/votes/:id
   Delete vote + related casts & invites
   ----------------------------- */
const deleteVote = async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await Vote.findById(id);
    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    // Remove all related data to keep things clean
    await VoteCast.deleteMany({ vote: vote._id });
    await VoteInvite.deleteMany({ vote: vote._id });
    await Vote.deleteOne({ _id: vote._id });

    return res.json({
      message: "Vote deleted successfully",
    });
  } catch (error) {
    console.error("Delete vote error:", error);
    return res.status(500).json({
      message: "Server error while deleting vote",
    });
  }
};

// GET /api/votes
// Includes hasUnresolvedTie for ended votes (used in Winners page)
const getVotes = async (req, res) => {
  try {
    const now = new Date();

    const votes = await Vote.find()
      .populate("locations", "name code")
      .populate({
        path: "winners.location",
        select: "_id",
      })
      .populate({
        path: "winners.employee",
        select: "_id",
      })
      .sort({ createdAt: -1 });

    const votesWithStats = await Promise.all(
      votes.map(async (voteDoc) => {
        const vote = voteDoc.toObject();
        const totalVoters = Array.isArray(vote.voters) ? vote.voters.length : 0;

        const totalVotesCast = await VoteCast.countDocuments({
          vote: vote._id,
        });

        const remainingVoters = Math.max(totalVoters - totalVotesCast, 0);

        const hasStarted = now >= vote.startAt;
        const hasEnded = now > vote.endAt;
        const isActive = hasStarted && !hasEnded;

        let hasUnresolvedTie = false;

        // Only check for ties if voting has ended
        if (hasEnded) {
          try {
            const fullVote = await Vote.findById(vote._id)
              .populate("locations", "name code")
              .populate({
                path: "nominees",
                populate: {
                  path: "locations",
                  select: "name code",
                },
              })
              .populate({
                path: "winners.location",
                select: "_id",
              })
              .populate({
                path: "winners.employee",
                select: "_id",
              });

            if (fullVote) {
              const voteCasts = await VoteCast.find({
                vote: vote._id,
              }).populate({
                path: "nominees",
                populate: {
                  path: "locations",
                  select: "name code",
                },
              });

              const stats = computeVoteStats(fullVote, voteCasts);
              const { nominees, raw, voteMeta } = stats;
              const { locationSummaryMap } = raw;

              const winnerMap = new Map();
              (fullVote.winners || []).forEach((w) => {
                if (!w.location) return;
                const locIdStr = String(w.location._id || w.location);
                winnerMap.set(locIdStr, w);
              });

              for (const loc of voteMeta.locations) {
                const locIdStr = String(loc._id);
                const locSummary = locationSummaryMap.get(locIdStr);
                const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;
                if (locationTotal <= 0) continue;

                const locationNominees = nominees.map((n) => {
                  const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
                  const locVotes = locData ? locData.votes : 0;
                  return {
                    _id: n._id,
                    locationVotes: locVotes,
                  };
                });

                let maxVotes = 0;
                locationNominees.forEach((n) => {
                  if (n.locationVotes > maxVotes) {
                    maxVotes = n.locationVotes;
                  }
                });

                if (maxVotes <= 0) continue;

                const top = locationNominees.filter((n) => n.locationVotes === maxVotes);

                if (top.length > 1) {
                  const winnerDoc = winnerMap.get(locIdStr);
                  if (!winnerDoc) {
                    hasUnresolvedTie = true;
                    break;
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error computing tie info for vote:", vote._id, err);
          }
        }

        return {
          ...vote,
          totalVoters,
          totalVotesCast,
          remainingVoters,
          hasStarted,
          hasEnded,
          isActive,
          hasUnresolvedTie,
        };
      })
    );

    return res.json({
      votes: votesWithStats,
    });
  } catch (error) {
    console.error("Get votes error:", error);
    return res.status(500).json({
      message: "Server error while fetching votes",
    });
  }
};

// GET /api/votes/:id/voters
const getVoteVoters = async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await Vote.findById(id).populate("locations", "name code");

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const voters = await Employee.find({
      _id: { $in: vote.voters },
    }).sort({ firstName: 1, lastName: 1 });

    const voteCasts = await VoteCast.find({
      vote: vote._id,
    }).select("voter createdAt");

    const castMap = new Map();
    voteCasts.forEach((cast) => {
      castMap.set(String(cast.voter), cast);
    });

    const votersWithStatus = voters.map((voter) => {
      const cast = castMap.get(String(voter._id));
      return {
        employee: {
          _id: voter._id,
          firstName: voter.firstName,
          lastName: voter.lastName,
          employeeId: voter.employeeId,
          email: voter.email,
        },
        hasVoted: !!cast,
        votedAt: cast ? cast.createdAt : null,
      };
    });

    return res.json({
      vote: {
        _id: vote._id,
        name: vote.name,
        startAt: vote.startAt,
        endAt: vote.endAt,
      },
      voters: votersWithStatus,
    });
  } catch (error) {
    console.error("Get vote voters error:", error);
    return res.status(500).json({
      message: "Server error while fetching vote voters",
    });
  }
};

// GET /api/votes/:id/report
const getVoteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      });

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const voteCasts = await VoteCast.find({
      vote: id,
    }).populate({
      path: "nominees",
      populate: {
        path: "locations",
        select: "name code",
      },
    });

    const stats = computeVoteStats(vote, voteCasts);

    return res.json({
      vote: stats.voteMeta,
      nominees: stats.nominees,
      locationSummary: stats.locationSummary,
    });
  } catch (error) {
    console.error("Get vote report error:", error);
    return res.status(500).json({
      message: "Server error while generating vote report",
    });
  }
};

// GET /api/votes/:id/winners
// For Winners page: per store nominees, top group, tie info, and winner (auto or manual)
const getVoteWinners = async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      })
      .populate({
        path: "winners.employee",
        select: "firstName lastName employeeId",
      })
      .populate({
        path: "winners.location",
        select: "name code",
      });

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const voteCasts = await VoteCast.find({
      vote: id,
    }).populate({
      path: "nominees",
      populate: {
        path: "locations",
        select: "name code",
      },
    });

    const stats = computeVoteStats(vote, voteCasts);
    const { nominees, raw, voteMeta } = stats;
    const { locationSummaryMap, votePoints } = raw;

    const now = new Date();
    const hasStarted = now >= voteMeta.startAt;
    const hasEnded = now > voteMeta.endAt;
    const isActive = hasStarted && !hasEnded;

    const winnerMap = new Map();
    (vote.winners || []).forEach((w) => {
      if (!w.location || !w.employee) return;
      const locIdStr = String(w.location._id || w.location);
      winnerMap.set(locIdStr, w);
    });

    const locationsResults = [];

    voteMeta.locations.forEach((loc) => {
      const locIdStr = String(loc._id);
      const locSummary = locationSummaryMap.get(locIdStr);
      const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;

      // nominees for this location
      const locationNomineesRaw = nominees.map((n) => {
        const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
        const locVotes = locData ? locData.votes : 0;
        const locPoints = locVotes * votePoints;
        const locPct = locationTotal > 0 ? (locVotes / locationTotal) * 100 : 0;

        return {
          _id: n._id,
          firstName: n.firstName,
          lastName: n.lastName,
          employeeId: n.employeeId,
          totalVotes: n.totalVotes,
          totalPoints: n.totalPoints,
          overallPercentage: n.percentage,
          locationVotes: locVotes,
          locationPoints: locPoints,
          locationPercentage: locPct,
        };
      });

      let maxVotes = 0;
      locationNomineesRaw.forEach((n) => {
        if (n.locationVotes > maxVotes) {
          maxVotes = n.locationVotes;
        }
      });

      const nomineesWithTop = locationNomineesRaw.map((n) => ({
        ...n,
        isTop: maxVotes > 0 && n.locationVotes === maxVotes,
      }));

      const topNominees = maxVotes > 0 ? nomineesWithTop.filter((n) => n.isTop) : [];

      const isTie = maxVotes > 0 && topNominees.length > 1;

      // Determine official winner:
      // 1) use manual winner from DB if exists
      // 2) else, if vote ended and a single top nominee => auto winner
      let officialWinner = null;
      const winnerDoc = winnerMap.get(locIdStr);

      if (winnerDoc) {
        const found = nomineesWithTop.find(
          (n) => String(n._id) === String(winnerDoc.employee._id || winnerDoc.employee)
        );
        if (found) {
          officialWinner = {
            ...found,
            announcedAt: winnerDoc.announcedAt,
            isAuto: false,
          };
        }
      } else if (hasEnded && maxVotes > 0 && topNominees.length === 1) {
        const auto = topNominees[0];
        officialWinner = {
          ...auto,
          announcedAt: null,
          isAuto: true, // auto-selected because no tie
        };
      }

      // sort nominees by store votes
      nomineesWithTop.sort((a, b) => b.locationVotes - a.locationVotes);

      locationsResults.push({
        locationId: locIdStr,
        name: loc.name,
        code: loc.code,
        totalVotes: locationTotal,
        topNominees,
        nominees: nomineesWithTop,
        officialWinner,
        isTie,
      });
    });

    return res.json({
      vote: {
        ...voteMeta,
        hasStarted,
        hasEnded,
        isActive,
      },
      locations: locationsResults,
    });
  } catch (error) {
    console.error("Get vote winners error:", error);
    return res.status(500).json({
      message: "Server error while generating winners",
    });
  }
};

// POST /api/votes/:id/announce-winner
// Only allowed when there is a tie for that store and voting has ended
const announceWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { locationId, nomineeId } = req.body;

    if (!locationId || !nomineeId) {
      return res.status(400).json({
        message: "locationId and nomineeId are required",
      });
    }

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      });

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();
    if (now <= vote.endAt) {
      return res.status(400).json({
        message: "Winner can only be announced after the voting cycle has ended",
      });
    }

    const locIdStr = String(locationId);
    const nomineeIdStr = String(nomineeId);

    const locExists = vote.locations.some((loc) => String(loc._id) === locIdStr);
    if (!locExists) {
      return res.status(400).json({
        message: "Location is not part of this vote",
      });
    }

    const nomineeExists = vote.nominees.some((n) => String(n._id) === nomineeIdStr);
    if (!nomineeExists) {
      return res.status(400).json({
        message: "Nominee is not part of this vote",
      });
    }

    // Compute stats to verify tie and top group
    const voteCasts = await VoteCast.find({
      vote: id,
    }).populate({
      path: "nominees",
      populate: {
        path: "locations",
        select: "name code",
      },
    });

    const stats = computeVoteStats(vote, voteCasts);
    const { nominees, raw } = stats;
    const { locationSummaryMap } = raw;

    const locSummary = locationSummaryMap.get(locIdStr);
    const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;

    if (locationTotal <= 0) {
      return res.status(400).json({
        message: "No votes have been cast in this store",
      });
    }

    const locationNominees = nominees.map((n) => {
      const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
      const locVotes = locData ? locData.votes : 0;
      return {
        _id: n._id,
        locationVotes: locVotes,
      };
    });

    let maxVotes = 0;
    locationNominees.forEach((n) => {
      if (n.locationVotes > maxVotes) {
        maxVotes = n.locationVotes;
      }
    });

    if (maxVotes <= 0) {
      return res.status(400).json({
        message: "No votes have been cast in this store",
      });
    }

    const topNominees = locationNominees.filter((n) => n.locationVotes === maxVotes);

    // Manual selection only allowed when there is a tie
    if (topNominees.length < 2) {
      return res.status(400).json({
        message: "Manual winner selection is only allowed when there is a tie in this store",
      });
    }

    const nomineeStat = locationNominees.find((n) => String(n._id) === nomineeIdStr);

    if (!nomineeStat) {
      return res.status(400).json({
        message: "Nominee has no stats for this location",
      });
    }

    if (nomineeStat.locationVotes !== maxVotes) {
      return res.status(400).json({
        message:
          "Only nominees with the highest votes in this store can be announced as winner",
      });
    }

    // Upsert winner for this location
    const existing = vote.winners.find((w) => String(w.location) === locIdStr);
    if (existing) {
      existing.employee = nomineeIdStr;
      existing.announcedAt = new Date();
    } else {
      vote.winners.push({
        location: locIdStr,
        employee: nomineeIdStr,
        announcedAt: new Date(),
      });
    }

    await vote.save();

    return res.json({
      message: "Winner announced successfully",
    });
  } catch (error) {
    console.error("Announce winner error:", error);
    return res.status(500).json({
      message: "Server error while announcing winner",
    });
  }
};

// GET /api/votes/:id/official-winners
// Only winners per store (manual or auto) for this vote
const getOfficialWinners = async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      })
      .populate({
        path: "winners.employee",
        select: "firstName lastName employeeId",
      })
      .populate({
        path: "winners.location",
        select: "name code",
      });

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const voteCasts = await VoteCast.find({
      vote: id,
    }).populate({
      path: "nominees",
      populate: {
        path: "locations",
        select: "name code",
      },
    });

    const stats = computeVoteStats(vote, voteCasts);
    const { nominees, raw, voteMeta } = stats;
    const { locationSummaryMap, votePoints } = raw;

    const now = new Date();
    const hasEnded = now > voteMeta.endAt;

    const winnerMap = new Map();
    (vote.winners || []).forEach((w) => {
      if (!w.location || !w.employee) return;
      const locIdStr = String(w.location._id || w.location);
      winnerMap.set(locIdStr, w);
    });

    const locationsResults = [];

    voteMeta.locations.forEach((loc) => {
      const locIdStr = String(loc._id);
      const locSummary = locationSummaryMap.get(locIdStr);
      const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;

      const locationNomineesRaw = nominees.map((n) => {
        const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
        const locVotes = locData ? locData.votes : 0;
        const locPoints = locVotes * votePoints;
        const locPct = locationTotal > 0 ? (locVotes / locationTotal) * 100 : 0;

        return {
          _id: n._id,
          firstName: n.firstName,
          lastName: n.lastName,
          employeeId: n.employeeId,
          totalVotes: n.totalVotes,
          totalPoints: n.totalPoints,
          overallPercentage: n.percentage,
          locationVotes: locVotes,
          locationPoints: locPoints,
          locationPercentage: locPct,
        };
      });

      let maxVotes = 0;
      locationNomineesRaw.forEach((n) => {
        if (n.locationVotes > maxVotes) {
          maxVotes = n.locationVotes;
        }
      });

      const topNominees =
        maxVotes > 0
          ? locationNomineesRaw.filter((n) => n.locationVotes === maxVotes)
          : [];

      let winner = null;
      const winnerDoc = winnerMap.get(locIdStr);

      if (winnerDoc) {
        const found = locationNomineesRaw.find(
          (n) => String(n._id) === String(winnerDoc.employee._id || winnerDoc.employee)
        );
        if (found) {
          winner = {
            ...found,
            announcedAt: winnerDoc.announcedAt,
            isAuto: false,
          };
        }
      } else if (hasEnded && maxVotes > 0 && topNominees.length === 1) {
        const auto = topNominees[0];
        winner = {
          ...auto,
          announcedAt: null,
          isAuto: true,
        };
      }

      locationsResults.push({
        locationId: locIdStr,
        name: loc.name,
        code: loc.code,
        totalVotes: locationTotal,
        winner,
      });
    });

    return res.json({
      vote: voteMeta,
      locations: locationsResults,
    });
  } catch (error) {
    console.error("Get official winners error:", error);
    return res.status(500).json({
      message: "Server error while fetching official winners",
    });
  }
};

// GET /api/votes/winners/history
// All past votes (ended) with store winners and nominee stats
const getWinnersHistory = async (req, res) => {
  try {
    const now = new Date();

    const votes = await Vote.find({
      endAt: { $lt: now },
    })
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      })
      .populate({
        path: "winners.employee",
        select: "firstName lastName employeeId",
      })
      .populate({
        path: "winners.location",
        select: "name code",
      })
      .sort({ endAt: -1 });

    const history = [];

    for (const vote of votes) {
      const voteCasts = await VoteCast.find({
        vote: vote._id,
      }).populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      });

      const stats = computeVoteStats(vote, voteCasts);
      const { nominees, raw, voteMeta } = stats;
      const { locationSummaryMap, votePoints } = raw;

      const winnerMap = new Map();
      (vote.winners || []).forEach((w) => {
        if (!w.location || !w.employee) return;
        const locIdStr = String(w.location._id || w.location);
        winnerMap.set(locIdStr, w);
      });

      const locationsResults = [];

      voteMeta.locations.forEach((loc) => {
        const locIdStr = String(loc._id);
        const locSummary = locationSummaryMap.get(locIdStr);
        const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;

        const locationNomineesRaw = nominees.map((n) => {
          const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
          const locVotes = locData ? locData.votes : 0;
          const locPoints = locVotes * votePoints;
          const locPct = locationTotal > 0 ? (locVotes / locationTotal) * 100 : 0;

          return {
            _id: n._id,
            firstName: n.firstName,
            lastName: n.lastName,
            employeeId: n.employeeId,
            totalVotes: n.totalVotes,
            totalPoints: n.totalPoints,
            overallPercentage: n.percentage,
            locationVotes: locVotes,
            locationPoints: locPoints,
            locationPercentage: locPct,
          };
        });

        // sort nominees by store votes
        locationNomineesRaw.sort((a, b) => b.locationVotes - a.locationVotes);

        let maxVotes = 0;
        locationNomineesRaw.forEach((n) => {
          if (n.locationVotes > maxVotes) {
            maxVotes = n.locationVotes;
          }
        });

        const topNominees =
          maxVotes > 0
            ? locationNomineesRaw.filter((n) => n.locationVotes === maxVotes)
            : [];

        let winner = null;
        const winnerDoc = winnerMap.get(locIdStr);

        if (winnerDoc) {
          const found = locationNomineesRaw.find(
            (n) => String(n._id) === String(winnerDoc.employee._id || winnerDoc.employee)
          );
          if (found) {
            winner = {
              ...found,
              announcedAt: winnerDoc.announcedAt,
              isAuto: false,
            };
          }
        } else if (maxVotes > 0 && topNominees.length === 1) {
          const auto = topNominees[0];
          winner = {
            ...auto,
            announcedAt: null,
            isAuto: true,
          };
        }

        locationsResults.push({
          locationId: locIdStr,
          name: loc.name,
          code: loc.code,
          totalVotes: locationTotal,
          winner,
          nominees: locationNomineesRaw,
        });
      });

      history.push({
        vote: voteMeta,
        locations: locationsResults,
      });
    }

    return res.json({
      history,
    });
  } catch (error) {
    console.error("Get winners history error:", error);
    return res.status(500).json({
      message: "Server error while fetching winners history",
    });
  }
};

// POST /api/votes/:id/check-employee
const checkEmployeeEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    const vote = await Vote.findById(id)
      .populate("nominees", "firstName lastName employeeId")
      .populate("locations", "name code");

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();
    if (now < vote.startAt) {
      return res.status(400).json({
        message: "Voting has not started yet",
      });
    }

    if (now > vote.endAt) {
      return res.status(400).json({
        message: "Voting has ended",
      });
    }

    const employee = await Employee.findOne({
      employeeId: String(employeeId).trim(),
    });

    if (!employee) {
      return res.status(400).json({
        message: "Employee ID not found",
      });
    }

    const isVoter = vote.voters.some((voterId) => String(voterId) === String(employee._id));

    if (!isVoter) {
      return res.status(403).json({
        message: "You are not allowed to vote in this poll",
      });
    }

    const existing = await VoteCast.findOne({
      vote: vote._id,
      voter: employee._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already voted in this poll",
      });
    }

    return res.json({
      message: "You are eligible to vote",
      voter: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
      },
      vote: {
        _id: vote._id,
        name: vote.name,
        maxVotesPerVoter: vote.maxVotesPerVoter,
        votePoints: vote.votePoints,
        nominees: vote.nominees.map((n) => ({
          _id: n._id,
          firstName: n.firstName,
          lastName: n.lastName,
          employeeId: n.employeeId,
        })),
      },
    });
  } catch (error) {
    console.error("Check employee eligibility error:", error);
    return res.status(500).json({
      message: "Server error while checking eligibility",
    });
  }
};

// POST /api/votes/:id/cast
const castVote = async (req, res) => {
  try {
    const { id } = req.params;
    let { employeeId, nomineeIds } = req.body;

    if (!employeeId || !nomineeIds) {
      return res.status(400).json({
        message: "Employee ID and nominees are required",
      });
    }

    if (!Array.isArray(nomineeIds)) {
      nomineeIds = [nomineeIds];
    }

    const nomineeIdList = normalizeIdArray(nomineeIds);

    if (nomineeIdList.length === 0) {
      return res.status(400).json({
        message: "Please select at least one nominee",
      });
    }

    const vote = await Vote.findById(id);

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();
    if (now < vote.startAt) {
      return res.status(400).json({
        message: "Voting has not started yet",
      });
    }

    if (now > vote.endAt) {
      return res.status(400).json({
        message: "Voting has ended",
      });
    }

    const employee = await Employee.findOne({
      employeeId: String(employeeId).trim(),
    });

    if (!employee) {
      return res.status(400).json({
        message: "Employee ID not found",
      });
    }

    const isVoter = vote.voters.some((voterId) => String(voterId) === String(employee._id));

    if (!isVoter) {
      return res.status(403).json({
        message: "You are not allowed to vote in this poll",
      });
    }

    const existing = await VoteCast.findOne({
      vote: vote._id,
      voter: employee._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already voted in this poll",
      });
    }

    if (nomineeIdList.length > vote.maxVotesPerVoter) {
      return res.status(400).json({
        message: `You can select up to ${vote.maxVotesPerVoter} nominees`,
      });
    }

    const allowedNomineeSet = new Set(vote.nominees.map((nid) => String(nid)));
    const invalidNominee = nomineeIdList.find((nid) => !allowedNomineeSet.has(String(nid)));

    if (invalidNominee) {
      return res.status(400).json({
        message: "Invalid nominee selected",
      });
    }

    await VoteCast.create({
      vote: vote._id,
      voter: employee._id,
      nominees: nomineeIdList,
    });

    return res.status(201).json({
      message: "Your vote has been submitted",
    });
  } catch (error) {
    console.error("Cast vote error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already voted in this poll",
      });
    }

    return res.status(500).json({
      message: "Server error while casting vote",
    });
  }
};

/* ============================
   Invite-based voting
   ============================ */

// POST /api/votes/:id/send-invites
// UPDATED: Everyone receives link + nominee list (first 3, then "and X others" if more)
const sendVoteInvites = async (req, res) => {
  try {
    const { id } = req.params;
    const { sendMode, selectedEmployeeIds } = req.body || {};

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate("voters", "firstName lastName email employeeId")
      .populate("nominees", "firstName lastName employeeId");

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    if (!vote.voters || vote.voters.length === 0) {
      return res.status(400).json({
        message: "No voters assigned to this vote",
      });
    }

    const now = new Date();
    if (now > vote.endAt) {
      return res.status(400).json({
        message: "Cannot send invites because voting has already ended",
      });
    }

    let targetVoters = vote.voters;

    // sendMode = "selected" -> only selectedEmployeeIds
    if (sendMode === "selected") {
      const selectedSet = new Set((selectedEmployeeIds || []).map((id) => String(id).trim()));

      if (selectedSet.size === 0) {
        return res.status(400).json({
          message: "No employees selected for invite",
        });
      }

      targetVoters = vote.voters.filter((v) => selectedSet.has(String(v._id)));

      if (targetVoters.length === 0) {
        return res.status(400).json({
          message: "Selected employees are not voters in this vote",
        });
      }
    }

    // Build nominee list HTML for everyone (limit to 3 + "and X others")
    const allNominees = Array.isArray(vote.nominees) ? vote.nominees : [];
    const nomineePreview = allNominees.slice(0, 3);
    const remainingCount = Math.max(allNominees.length - nomineePreview.length, 0);

    const nomineeListHtml =
      allNominees.length > 0
        ? `
          <div style="margin:0 0 16px;padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;font-weight:700;font-size:13px;color:#111827;">
              Nominees for this cycle
            </p>
            <ul style="padding-left:18px;margin:0;font-size:13px;color:#374151;line-height:1.55;">
              ${nomineePreview
                .map((n) => `<li>${n.firstName} ${n.lastName} (${n.employeeId})</li>`)
                .join("")}
              ${
                remainingCount > 0
                  ? `<li style="list-style:none;padding-left:0;margin-top:6px;color:#6b7280;">
                       and ${remainingCount} others
                     </li>`
                  : ""
              }
            </ul>
          </div>
        `
        : "";

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const voter of targetVoters) {
      if (!voter.email || !String(voter.email).trim()) {
        failureCount++;
        errors.push({
          employeeId: voter.employeeId,
          reason: "Missing email address",
        });
        continue;
      }

      const token = crypto.randomBytes(24).toString("hex");

      const invite = await VoteInvite.findOneAndUpdate(
        {
          vote: vote._id,
          employee: voter._id,
        },
        {
          token,
          used: false,
          usedAt: null,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      const link = `${CLIENT_BASE_URL}/vote/${vote._id}/invite/${invite.token}`;

      const subject = `Voting invite: ${vote.name}`;

      // Base email content (everyone gets this)
      // Nominee list MUST appear before the button
      const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#f3f4f6; padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,0.18);">
            <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:20px 24px;color:#ffffff;">
              <h1 style="margin:0;font-size:20px;font-weight:700;">Munchies Voting</h1>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">
                Employee of the Cycle – secure voting link
              </p>
            </div>

            <div style="padding:24px 24px 8px;">
              <p style="margin:0 0 12px;font-size:14px;color:#111827;">
                Hi <strong>${voter.firstName || ""} ${voter.lastName || ""}</strong>,
              </p>
              <p style="margin:0 0 12px;font-size:14px;color:#374151;">
                You have been invited to vote in
                <strong>${vote.name}</strong>.
              </p>

              ${nomineeListHtml}

              <p style="margin:0 0 12px;font-size:13px;color:#4b5563;">
                Please use the button below to cast your vote. This link can be used
                <strong>only once</strong>, and it is unique to you.
              </p>

              <div style="text-align:center;margin:20px 0 16px;">
                <a href="${link}"
                  style="
                    display:inline-block;
                    padding:10px 20px;
                    background:linear-gradient(135deg,#6366f1,#a855f7);
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:999px;
                    font-size:14px;
                    font-weight:600;
                    box-shadow:0 8px 20px rgba(88,80,236,0.35);
                  ">
                  Open voting page
                </a>
              </div>

              <p style="margin:0 0 16px;font-size:12px;color:#6b7280;word-break:break-all;">
                Or copy and paste this link into your browser:<br/>
                <span style="font-family:monospace;font-size:11px;color:#111827;">${link}</span>
              </p>

              <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">
                If you did not expect this email, you can safely ignore it.
              </p>
            </div>

            <div style="border-top:1px solid #e5e7eb;padding:12px 18px;text-align:center;background:#f9fafb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                Munchies Voting System • Internal use only
              </p>
            </div>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: voter.email,
          subject,
          html,
        });
        console.log(
          `Invite sent to ${voter.email} (employeeId=${voter.employeeId}) token=${invite.token}`
        );
        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({
          employeeId: voter.employeeId,
          email: voter.email,
          reason: err.message,
        });
      }
    }

    return res.json({
      message: "Invite emails processed for this vote",
      totalVoters: targetVoters.length,
      successCount,
      failureCount,
      errors,
    });
  } catch (error) {
    console.error("Send vote invites error:", error);
    return res.status(500).json({
      message: "Server error while sending vote invites",
    });
  }
};

// GET /api/votes/:id/invite/:token
// Validates the link and returns data.
// DOES NOT mark invite.used here.
const getInviteDetails = async (req, res) => {
  try {
    const { id, token } = req.params;

    const invite = await VoteInvite.findOne({
      vote: id,
      token,
    }).populate("employee", "firstName lastName employeeId email");

    if (!invite) {
      return res.status(404).json({
        message: "Invalid or expired voting link",
      });
    }

    const vote = await Vote.findById(id)
      .populate("nominees", "firstName lastName employeeId")
      .populate("locations", "name code");

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();

    if (now < vote.startAt) {
      return res.status(400).json({
        message: "Voting has not started yet",
      });
    }

    if (now > vote.endAt) {
      return res.status(400).json({
        message: "Voting has ended",
      });
    }

    const isVoter = vote.voters.some(
      (voterId) => String(voterId) === String(invite.employee._id)
    );

    if (!isVoter) {
      return res.status(403).json({
        message: "You are not allowed to vote in this poll",
      });
    }

    const existingCast = await VoteCast.findOne({
      vote: vote._id,
      voter: invite.employee._id,
    });

    if (existingCast) {
      // If already voted, mark invite as used (if not already)
      if (!invite.used) {
        invite.used = true;
        invite.usedAt = new Date();
        await invite.save();
      }

      return res.status(400).json({
        message: "You have already voted in this poll",
      });
    }

    // Do NOT mark invite.used here. Only after successful vote.

    return res.json({
      message: "You are eligible to vote",
      voter: {
        _id: invite.employee._id,
        firstName: invite.employee.firstName,
        lastName: invite.employee.lastName,
        employeeId: invite.employee.employeeId,
        email: invite.employee.email,
      },
      vote: {
        _id: vote._id,
        name: vote.name,
        maxVotesPerVoter: vote.maxVotesPerVoter,
        votePoints: vote.votePoints,
        locations: vote.locations,
        nominees: vote.nominees.map((n) => ({
          _id: n._id,
          firstName: n.firstName,
          lastName: n.lastName,
          employeeId: n.employeeId,
        })),
      },
    });
  } catch (error) {
    console.error("Get invite details error:", error);
    return res.status(500).json({
      message: "Server error while processing invite link",
    });
  }
};

// POST /api/votes/:id/invite/:token/cast
// Cast vote using invite token (employee is identified from token; no ID input)
const castVoteWithInvite = async (req, res) => {
  try {
    const { id, token } = req.params;
    let { nomineeIds } = req.body;

    if (!nomineeIds) {
      return res.status(400).json({
        message: "Please select at least one nominee",
      });
    }

    if (!Array.isArray(nomineeIds)) {
      nomineeIds = [nomineeIds];
    }

    const nomineeIdList = normalizeIdArray(nomineeIds);

    if (nomineeIdList.length === 0) {
      return res.status(400).json({
        message: "Please select at least one nominee",
      });
    }

    const invite = await VoteInvite.findOne({
      vote: id,
      token,
    }).populate("employee");

    if (!invite) {
      return res.status(404).json({
        message: "Invalid or expired voting link",
      });
    }

    const vote = await Vote.findById(id);

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();
    if (now < vote.startAt) {
      return res.status(400).json({
        message: "Voting has not started yet",
      });
    }

    if (now > vote.endAt) {
      return res.status(400).json({
        message: "Voting has ended",
      });
    }

    const employee = invite.employee;

    const isVoter = vote.voters.some((voterId) => String(voterId) === String(employee._id));

    if (!isVoter) {
      return res.status(403).json({
        message: "You are not allowed to vote in this poll",
      });
    }

    const existing = await VoteCast.findOne({
      vote: vote._id,
      voter: employee._id,
    });

    if (existing) {
      if (!invite.used) {
        invite.used = true;
        invite.usedAt = new Date();
        await invite.save();
      }

      return res.status(400).json({
        message: "You have already voted in this poll",
      });
    }

    if (nomineeIdList.length > vote.maxVotesPerVoter) {
      return res.status(400).json({
        message: `You can select up to ${vote.maxVotesPerVoter} nominees`,
      });
    }

    const allowedNomineeSet = new Set(vote.nominees.map((nid) => String(nid)));
    const invalidNominee = nomineeIdList.find((nid) => !allowedNomineeSet.has(String(nid)));

    if (invalidNominee) {
      return res.status(400).json({
        message: "Invalid nominee selected",
      });
    }

    await VoteCast.create({
      vote: vote._id,
      voter: employee._id,
      nominees: nomineeIdList,
    });

    // Mark invite as used AFTER successful vote
    invite.used = true;
    invite.usedAt = new Date();
    await invite.save();

    return res.status(201).json({
      message: "Your vote has been submitted",
    });
  } catch (error) {
    console.error("Cast vote with invite error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already voted in this poll",
      });
    }

    return res.status(500).json({
      message: "Server error while casting vote",
    });
  }
};

/* ============================
   Notify emails (winners)
   ============================ */

// Professional HTML email template (inline CSS; email-safe)
const buildWinnerSummaryEmailHtml = ({
  voteName,
  recipientName,
  locationsResults,
  isWinnerSomewhere,
}) => {
  const rowsHtml = locationsResults
    .map((loc) => {
      const storeLabel = `${loc.name} (${loc.code})`;

      if (!loc.winner) {
        const msg =
          loc.totalVotes <= 0
            ? "No votes were cast"
            : "Winner not announced yet (tie / pending)";
        return `
          <tr>
            <td style="padding:12px 14px;border-bottom:1px solid #eef2f7;color:#111827;font-size:13px;">
              ${storeLabel}
            </td>
            <td style="padding:12px 14px;border-bottom:1px solid #eef2f7;color:#6b7280;font-size:13px;">
              <em>${msg}</em>
            </td>
          </tr>
        `;
      }

      const w = loc.winner;
      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #eef2f7;color:#111827;font-size:13px;">
            ${storeLabel}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #eef2f7;color:#111827;font-size:13px;">
            <strong>${w.firstName} ${w.lastName}</strong>
            <span style="color:#6b7280;">(${w.employeeId})</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const congratsBlock = isWinnerSomewhere
    ? `
      <div style="margin:16px 0 0;padding:14px 14px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;">
        <p style="margin:0;font-size:14px;color:#065f46;font-weight:700;">Congratulations! 🎉</p>
        <p style="margin:6px 0 0;font-size:13px;color:#065f46;">
          You are listed as a winner in this cycle for at least one store.
        </p>
      </div>
    `
    : "";

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="padding:24px;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 14px 34px rgba(15,23,42,0.18);">
          
          <div style="background:linear-gradient(135deg,#4f46e5,#9333ea);padding:22px 24px;color:#ffffff;">
            <div style="font-size:12px;opacity:0.9;letter-spacing:0.4px;">Munchies Voting</div>
            <div style="margin-top:6px;font-size:20px;font-weight:800;line-height:1.2;">Results Announced</div>
            <div style="margin-top:6px;font-size:13px;opacity:0.92;">${voteName}</div>
          </div>

          <div style="padding:22px 24px 10px;">
            <p style="margin:0 0 12px;font-size:14px;color:#111827;">
              Hi <strong>${recipientName}</strong>,
            </p>

            <p style="margin:0 0 14px;font-size:13px;color:#374151;line-height:1.55;">
              The voting cycle <strong>${voteName}</strong> has finished. Below is the winner summary for each store.
            </p>

            ${congratsBlock}

            <div style="margin:16px 0 0;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th align="left" style="padding:12px 14px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eef2f7;">
                      Store
                    </th>
                    <th align="left" style="padding:12px 14px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eef2f7;">
                      Winner
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>

            <p style="margin:16px 0 0;font-size:12px;color:#6b7280;line-height:1.55;">
              Thank you for taking part and supporting your team. Keep up the great work!
            </p>
          </div>

          <div style="border-top:1px solid #e5e7eb;padding:12px 18px;text-align:center;background:#f9fafb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Munchies Voting System • Internal use only
            </p>
          </div>

        </div>
      </div>
    </div>
  `;
};

// POST /api/votes/:id/notify-nominees-winners
// UPDATED: Sends winner summary email to ALL employees in this vote cycle (voters + nominees), only after voting has ended.
const sendWinnerSummaryToNominees = async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      })
      .populate({
        path: "winners.employee",
        select: "firstName lastName employeeId",
      })
      .populate({
        path: "winners.location",
        select: "name code",
      });

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();
    if (now <= vote.endAt) {
      return res.status(400).json({
        message: "Winner summary can only be sent after the voting cycle has ended",
      });
    }

    if (!vote.voters || vote.voters.length === 0) {
      return res.status(400).json({
        message: "No voters configured for this vote",
      });
    }

    // Compute results (same logic as before)
    const voteCasts = await VoteCast.find({
      vote: id,
    }).populate({
      path: "nominees",
      populate: {
        path: "locations",
        select: "name code",
      },
    });

    const stats = computeVoteStats(vote, voteCasts);
    const { nominees, raw, voteMeta } = stats;
    const { locationSummaryMap, votePoints } = raw;

    const winnerMap = new Map();
    (vote.winners || []).forEach((w) => {
      if (!w.location || !w.employee) return;
      const locIdStr = String(w.location._id || w.location);
      winnerMap.set(locIdStr, w);
    });

    const locationsResults = [];

    voteMeta.locations.forEach((loc) => {
      const locIdStr = String(loc._id);
      const locSummary = locationSummaryMap.get(locIdStr);
      const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;

      const locationNomineesRaw = nominees.map((n) => {
        const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
        const locVotes = locData ? locData.votes : 0;
        const locPoints = locVotes * votePoints;
        const locPct = locationTotal > 0 ? (locVotes / locationTotal) * 100 : 0;

        return {
          _id: n._id,
          firstName: n.firstName,
          lastName: n.lastName,
          employeeId: n.employeeId,
          totalVotes: n.totalVotes,
          totalPoints: n.totalPoints,
          overallPercentage: n.percentage,
          locationVotes: locVotes,
          locationPoints: locPoints,
          locationPercentage: locPct,
        };
      });

      let maxVotes = 0;
      locationNomineesRaw.forEach((n) => {
        if (n.locationVotes > maxVotes) {
          maxVotes = n.locationVotes;
        }
      });

      const topNominees =
        maxVotes > 0
          ? locationNomineesRaw.filter((n) => n.locationVotes === maxVotes)
          : [];

      let winner = null;
      const winnerDoc = winnerMap.get(locIdStr);

      if (winnerDoc) {
        const found = locationNomineesRaw.find(
          (n) => String(n._id) === String(winnerDoc.employee._id || winnerDoc.employee)
        );
        if (found) {
          winner = {
            ...found,
            announcedAt: winnerDoc.announcedAt,
            isAuto: false,
          };
        }
      } else if (maxVotes > 0 && topNominees.length === 1) {
        const auto = topNominees[0];
        winner = {
          ...auto,
          announcedAt: null,
          isAuto: true,
        };
      }

      locationsResults.push({
        locationId: locIdStr,
        name: loc.name,
        code: loc.code,
        totalVotes: locationTotal,
        winner,
      });
    });

    // ✅ UPDATED RECIPIENTS:
    // Send to ALL employees in this cycle: voters + nominees (de-dupe)
    const voterIds = (vote.voters || []).map((v) => String(v));
    const nomineeIds = (vote.nominees || []).map((n) => String(n._id || n));
    const allRecipientIdSet = new Set([...voterIds, ...nomineeIds]);
    const allRecipientIds = Array.from(allRecipientIdSet);

    const recipients = await Employee.find({
      _id: { $in: allRecipientIds },
    }).select("firstName lastName email employeeId");

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        message: "No employees found to notify for this vote",
      });
    }

    const subject = `Vote results: ${vote.name}`;

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Build quick lookup for “is winner”
    const winnerEmployeeIdSet = new Set(
      locationsResults
        .filter((l) => l.winner && l.winner.employeeId)
        .map((l) => String(l.winner.employeeId))
    );

    for (const person of recipients) {
      if (!person.email || !String(person.email).trim()) {
        failureCount++;
        errors.push({
          employeeId: person.employeeId,
          reason: "Missing email address",
        });
        continue;
      }

      const recipientName = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "there";
      const isWinnerSomewhere = winnerEmployeeIdSet.has(String(person.employeeId));

      const html = buildWinnerSummaryEmailHtml({
        voteName: vote.name,
        recipientName,
        locationsResults,
        isWinnerSomewhere,
      });

      try {
        await sendEmail({
          to: person.email,
          subject,
          html,
        });
        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({
          employeeId: person.employeeId,
          email: person.email,
          reason: err.message,
        });
      }
    }

    return res.json({
      message: "Winner summary emails processed for this vote (all employees)",
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      errors,
    });
  } catch (error) {
    console.error("Send winner summary to nominees error:", error);
    return res.status(500).json({
      message: "Server error while sending winner summary emails",
    });
  }
};

/* ============================
   ✅ NEW: Notify ONLY ONE STORE (per-location)
   ============================ */

// POST /api/votes/:id/notify-location-winner
// Sends winner summary email ONLY to employees of ONE store (location) for this vote cycle.
const sendWinnerSummaryToLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { locationId } = req.body || {};

    if (!locationId) {
      return res.status(400).json({
        message: "locationId is required",
      });
    }

    const locIdStr = String(locationId);

    const vote = await Vote.findById(id)
      .populate("locations", "name code")
      .populate({
        path: "nominees",
        populate: {
          path: "locations",
          select: "name code",
        },
      })
      .populate({
        path: "winners.employee",
        select: "firstName lastName employeeId",
      })
      .populate({
        path: "winners.location",
        select: "name code",
      });

    if (!vote) {
      return res.status(404).json({
        message: "Vote not found",
      });
    }

    const now = new Date();
    if (now <= vote.endAt) {
      return res.status(400).json({
        message: "Store winner notification can only be sent after the voting cycle has ended",
      });
    }

    // Validate location is part of this vote
    const locationDoc = (vote.locations || []).find((l) => String(l._id) === locIdStr);
    if (!locationDoc) {
      return res.status(400).json({
        message: "Location is not part of this vote",
      });
    }

    // Compute results for all locations, then filter to one location (safe, logic unchanged)
    const voteCasts = await VoteCast.find({
      vote: id,
    }).populate({
      path: "nominees",
      populate: {
        path: "locations",
        select: "name code",
      },
    });

    const stats = computeVoteStats(vote, voteCasts);
    const { nominees, raw, voteMeta } = stats;
    const { locationSummaryMap, votePoints } = raw;

    const winnerMap = new Map();
    (vote.winners || []).forEach((w) => {
      if (!w.location || !w.employee) return;
      const locKey = String(w.location._id || w.location);
      winnerMap.set(locKey, w);
    });

    // Build location result for this specific store only
    const locSummary = locationSummaryMap.get(locIdStr);
    const locationTotal = locSummary ? locSummary.totalNomineeVotes : 0;

    const locationNomineesRaw = nominees.map((n) => {
      const locData = (n.votesByLocation || []).find((v) => v.locationId === locIdStr);
      const locVotes = locData ? locData.votes : 0;
      const locPoints = locVotes * votePoints;
      const locPct = locationTotal > 0 ? (locVotes / locationTotal) * 100 : 0;

      return {
        _id: n._id,
        firstName: n.firstName,
        lastName: n.lastName,
        employeeId: n.employeeId,
        totalVotes: n.totalVotes,
        totalPoints: n.totalPoints,
        overallPercentage: n.percentage,
        locationVotes: locVotes,
        locationPoints: locPoints,
        locationPercentage: locPct,
      };
    });

    let maxVotes = 0;
    locationNomineesRaw.forEach((n) => {
      if (n.locationVotes > maxVotes) maxVotes = n.locationVotes;
    });

    const topNominees =
      maxVotes > 0 ? locationNomineesRaw.filter((n) => n.locationVotes === maxVotes) : [];

    let winner = null;
    const winnerDoc = winnerMap.get(locIdStr);

    if (winnerDoc) {
      const found = locationNomineesRaw.find(
        (n) => String(n._id) === String(winnerDoc.employee._id || winnerDoc.employee)
      );
      if (found) {
        winner = {
          ...found,
          announcedAt: winnerDoc.announcedAt,
          isAuto: false,
        };
      }
    } else if (maxVotes > 0 && topNominees.length === 1) {
      winner = {
        ...topNominees[0],
        announcedAt: null,
        isAuto: true,
      };
    }

    const locationsResults = [
      {
        locationId: locIdStr,
        name: locationDoc.name,
        code: locationDoc.code,
        totalVotes: locationTotal,
        winner,
      },
    ];

    // Recipients: ALL employees in this vote cycle (voters + nominees) BUT ONLY those assigned to this location
    const voterIds = (vote.voters || []).map((v) => String(v));
    const nomineeIds = (vote.nominees || []).map((n) => String(n._id || n));
    const allRecipientIdSet = new Set([...voterIds, ...nomineeIds]);
    const allRecipientIds = Array.from(allRecipientIdSet);

    // IMPORTANT: Filter by locations: locIdStr
    const recipients = await Employee.find({
      _id: { $in: allRecipientIds },
      locations: locIdStr,
    }).select("firstName lastName email employeeId");

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        message: "No employees found for this store in this vote cycle",
      });
    }

    const subject = `Vote results (${locationDoc.code}): ${vote.name}`;

    // Winner check for THIS store only
    const winnerEmployeeIdSet = new Set(
      locationsResults
        .filter((l) => l.winner && l.winner.employeeId)
        .map((l) => String(l.winner.employeeId))
    );

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const person of recipients) {
      if (!person.email || !String(person.email).trim()) {
        failureCount++;
        errors.push({
          employeeId: person.employeeId,
          reason: "Missing email address",
        });
        continue;
      }

      const recipientName = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "there";
      const isWinnerSomewhere = winnerEmployeeIdSet.has(String(person.employeeId));

      const html = buildWinnerSummaryEmailHtml({
        voteName: vote.name,
        recipientName,
        locationsResults, // ONLY ONE STORE
        isWinnerSomewhere,
      });

      try {
        await sendEmail({
          to: person.email,
          subject,
          html,
        });
        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({
          employeeId: person.employeeId,
          email: person.email,
          reason: err.message,
        });
      }
    }

    return res.json({
      message: `Store winner notification processed for ${locationDoc.name} (${locationDoc.code})`,
      location: { _id: locIdStr, name: locationDoc.name, code: locationDoc.code },
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      errors,
    });
  } catch (error) {
    console.error("Send winner summary to location error:", error);
    return res.status(500).json({
      message: "Server error while sending store winner notifications",
    });
  }
};

module.exports = {
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
  sendWinnerSummaryToNominees,     // global
  sendWinnerSummaryToLocation,     // ✅ per-store (new)
};
