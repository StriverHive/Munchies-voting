// MongoDB shell script: set createdBy for all existing locations and employees
// Run with: mongosh "your_connection_string" your_db_name --file server/scripts/set-created-by-legacy.js
// Or paste the commands below into mongosh after switching to your database.

const CREATED_BY_USER_ID = ObjectId("69542218a477bc0dd0d513eb");

print("Updating locations...");
const locResult = db.locations.updateMany(
  { $or: [{ createdBy: null }, { createdBy: { $exists: false } }] },
  { $set: { createdBy: CREATED_BY_USER_ID } }
);
print("Locations modified: " + locResult.modifiedCount);

print("Updating employees...");
const empResult = db.employees.updateMany(
  { $or: [{ createdBy: null }, { createdBy: { $exists: false } }] },
  { $set: { createdBy: CREATED_BY_USER_ID } }
);
print("Employees modified: " + empResult.modifiedCount);

print("Done.");
