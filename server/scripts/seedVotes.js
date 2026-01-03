/**
 * Seed Script: Create Example Votes with Nominees, VoteCasts, and Winners
 * 
 * Run with: node server/scripts/seedVotes.js
 * 
 * This script:
 * 1. Fetches existing locations and employees
 * 2. Creates 4 example votes (2 completed, 1 ongoing, 1 upcoming)
 * 3. Generates realistic vote casts
 * 4. Assigns winners for completed votes
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Vote = require("../models/Vote");
const VoteCast = require("../models/VoteCast");
const Employee = require("../models/Employee");
const Location = require("../models/Location");

// Helper: get random items from array
const getRandomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

// Helper: get random item from array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: get date offset from now
const getDateOffset = (days, hours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date;
};

const seedVotes = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in server/.env file");
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch existing data
    const locations = await Location.find().lean();
    const employees = await Employee.find().populate("locations").lean();

    if (locations.length === 0) {
      throw new Error("No locations found in database. Please create locations first.");
    }
    if (employees.length < 10) {
      throw new Error("Need at least 10 employees in database. Found: " + employees.length);
    }

    console.log(`📍 Found ${locations.length} locations`);
    console.log(`👥 Found ${employees.length} employees`);

    // Clear existing votes and vote casts (optional - comment out if you want to keep existing)
    console.log("\n🧹 Clearing existing votes and vote casts...");
    await VoteCast.deleteMany({});
    await Vote.deleteMany({});
    console.log("✅ Cleared existing vote data");

    // ========================================
    // VOTE 1: Employee of the Month - December 2025 (COMPLETED)
    // ========================================
    console.log("\n📊 Creating Vote 1: Employee of the Month - December 2025...");
    
    const vote1Locations = locations.slice(0, 3); // First 3 locations
    const vote1LocationIds = vote1Locations.map(l => l._id);
    
    // Get employees from these locations
    const vote1Employees = employees.filter(emp => 
      emp.locations.some(loc => vote1LocationIds.some(id => id.equals(loc._id)))
    );
    
    // Select 5 nominees from these employees
    const vote1Nominees = getRandomItems(vote1Employees, 5);
    const vote1NomineeIds = vote1Nominees.map(n => n._id);
    
    // All employees in these locations can vote
    const vote1VoterIds = vote1Employees.map(e => e._id);

    const vote1 = await Vote.create({
      name: "Employee of the Month - December 2025",
      locations: vote1LocationIds,
      startAt: getDateOffset(-30), // Started 30 days ago
      endAt: getDateOffset(-7),    // Ended 7 days ago
      voters: vote1VoterIds,
      nominees: vote1NomineeIds,
      votePoints: 1,
      maxVotesPerVoter: 1,
      winners: [], // Will add after vote casts
    });

    // Generate vote casts (70% participation)
    const vote1Voters = getRandomItems(vote1Employees, Math.floor(vote1Employees.length * 0.7));
    const vote1VoteCounts = new Map(); // Track votes per nominee
    
    for (const voter of vote1Voters) {
      const selectedNominee = getRandomItem(vote1Nominees);
      await VoteCast.create({
        vote: vote1._id,
        voter: voter._id,
        nominees: [selectedNominee._id],
      });
      
      const count = vote1VoteCounts.get(String(selectedNominee._id)) || 0;
      vote1VoteCounts.set(String(selectedNominee._id), count + 1);
    }

    // Find winner(s) - highest vote count per location
    const vote1Winners = [];
    for (const loc of vote1Locations) {
      // Find nominees in this location
      const nomineesInLoc = vote1Nominees.filter(n => 
        n.locations.some(l => l._id.equals(loc._id))
      );
      
      if (nomineesInLoc.length > 0) {
        // Get nominee with highest votes
        let maxVotes = 0;
        let winner = nomineesInLoc[0];
        for (const nominee of nomineesInLoc) {
          const votes = vote1VoteCounts.get(String(nominee._id)) || 0;
          if (votes > maxVotes) {
            maxVotes = votes;
            winner = nominee;
          }
        }
        vote1Winners.push({
          location: loc._id,
          employee: winner._id,
          announcedAt: getDateOffset(-5),
        });
      }
    }

    vote1.winners = vote1Winners;
    await vote1.save();
    console.log(`✅ Vote 1 created: ${vote1Voters.length} votes cast, ${vote1Winners.length} winners`);

    // ========================================
    // VOTE 2: Best Team Player - November 2025 (COMPLETED)
    // ========================================
    console.log("\n📊 Creating Vote 2: Best Team Player - November 2025...");
    
    const vote2Locations = locations.slice(2, 5); // Last 3 locations (or all remaining)
    const vote2LocationIds = vote2Locations.map(l => l._id);
    
    const vote2Employees = employees.filter(emp => 
      emp.locations.some(loc => vote2LocationIds.some(id => id.equals(loc._id)))
    );
    
    const vote2Nominees = getRandomItems(vote2Employees, 6);
    const vote2NomineeIds = vote2Nominees.map(n => n._id);
    const vote2VoterIds = vote2Employees.map(e => e._id);

    const vote2 = await Vote.create({
      name: "Best Team Player - November 2025",
      locations: vote2LocationIds,
      startAt: getDateOffset(-60), // Started 60 days ago
      endAt: getDateOffset(-35),   // Ended 35 days ago
      voters: vote2VoterIds,
      nominees: vote2NomineeIds,
      votePoints: 1,
      maxVotesPerVoter: 2, // Can vote for 2 nominees
      winners: [],
    });

    // Generate vote casts (85% participation)
    const vote2Voters = getRandomItems(vote2Employees, Math.floor(vote2Employees.length * 0.85));
    const vote2VoteCounts = new Map();
    
    for (const voter of vote2Voters) {
      const selectedNominees = getRandomItems(vote2Nominees, 2);
      await VoteCast.create({
        vote: vote2._id,
        voter: voter._id,
        nominees: selectedNominees.map(n => n._id),
      });
      
      for (const nominee of selectedNominees) {
        const count = vote2VoteCounts.get(String(nominee._id)) || 0;
        vote2VoteCounts.set(String(nominee._id), count + 1);
      }
    }

    // Find winners
    const vote2Winners = [];
    for (const loc of vote2Locations) {
      const nomineesInLoc = vote2Nominees.filter(n => 
        n.locations.some(l => l._id.equals(loc._id))
      );
      
      if (nomineesInLoc.length > 0) {
        let maxVotes = 0;
        let winner = nomineesInLoc[0];
        for (const nominee of nomineesInLoc) {
          const votes = vote2VoteCounts.get(String(nominee._id)) || 0;
          if (votes > maxVotes) {
            maxVotes = votes;
            winner = nominee;
          }
        }
        vote2Winners.push({
          location: loc._id,
          employee: winner._id,
          announcedAt: getDateOffset(-33),
        });
      }
    }

    vote2.winners = vote2Winners;
    await vote2.save();
    console.log(`✅ Vote 2 created: ${vote2Voters.length} votes cast, ${vote2Winners.length} winners`);

    // ========================================
    // VOTE 3: Customer Service Star - January 2026 (ONGOING)
    // ========================================
    console.log("\n📊 Creating Vote 3: Customer Service Star - January 2026 (ONGOING)...");
    
    const vote3Locations = locations; // All locations
    const vote3LocationIds = vote3Locations.map(l => l._id);
    
    const vote3Employees = employees.filter(emp => 
      emp.locations.some(loc => vote3LocationIds.some(id => id.equals(loc._id)))
    );
    
    const vote3Nominees = getRandomItems(vote3Employees, 8);
    const vote3NomineeIds = vote3Nominees.map(n => n._id);
    const vote3VoterIds = vote3Employees.map(e => e._id);

    const vote3 = await Vote.create({
      name: "Customer Service Star - January 2026",
      locations: vote3LocationIds,
      startAt: getDateOffset(-3),  // Started 3 days ago
      endAt: getDateOffset(4),     // Ends in 4 days
      voters: vote3VoterIds,
      nominees: vote3NomineeIds,
      votePoints: 1,
      maxVotesPerVoter: 1,
      winners: [], // No winners yet - ongoing
    });

    // Generate vote casts (40% participation so far - it's ongoing)
    const vote3Voters = getRandomItems(vote3Employees, Math.floor(vote3Employees.length * 0.4));
    
    for (const voter of vote3Voters) {
      const selectedNominee = getRandomItem(vote3Nominees);
      await VoteCast.create({
        vote: vote3._id,
        voter: voter._id,
        nominees: [selectedNominee._id],
      });
    }

    console.log(`✅ Vote 3 created (ONGOING): ${vote3Voters.length} votes cast so far`);

    // ========================================
    // VOTE 4: Innovation Champion - February 2026 (UPCOMING)
    // ========================================
    console.log("\n📊 Creating Vote 4: Innovation Champion - February 2026 (UPCOMING)...");
    
    const vote4Locations = locations.slice(0, 2); // First 2 locations
    const vote4LocationIds = vote4Locations.map(l => l._id);
    
    const vote4Employees = employees.filter(emp => 
      emp.locations.some(loc => vote4LocationIds.some(id => id.equals(loc._id)))
    );
    
    const vote4Nominees = getRandomItems(vote4Employees, 4);
    const vote4NomineeIds = vote4Nominees.map(n => n._id);
    const vote4VoterIds = vote4Employees.map(e => e._id);

    const vote4 = await Vote.create({
      name: "Innovation Champion - February 2026",
      locations: vote4LocationIds,
      startAt: getDateOffset(7),   // Starts in 7 days
      endAt: getDateOffset(21),    // Ends in 21 days
      voters: vote4VoterIds,
      nominees: vote4NomineeIds,
      votePoints: 1,
      maxVotesPerVoter: 1,
      winners: [], // No winners - hasn't started
    });

    console.log(`✅ Vote 4 created (UPCOMING): Starts in 7 days`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 SEED COMPLETE - SUMMARY");
    console.log("=".repeat(60));
    
    const totalVotes = await Vote.countDocuments();
    const totalVoteCasts = await VoteCast.countDocuments();
    
    console.log(`\n✅ Total Votes Created: ${totalVotes}`);
    console.log(`✅ Total Vote Casts Created: ${totalVoteCasts}`);
    console.log("\nVotes breakdown:");
    console.log("  1. Employee of the Month - December 2025 (COMPLETED with winners)");
    console.log("  2. Best Team Player - November 2025 (COMPLETED with winners)");
    console.log("  3. Customer Service Star - January 2026 (ONGOING)");
    console.log("  4. Innovation Champion - February 2026 (UPCOMING)");
    console.log("\n🎉 Done! You can now view these votes in your app.");

  } catch (error) {
    console.error("❌ Error seeding votes:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the seed
seedVotes();

