/**
 * Shared in-memory Mongo + Express app bootstrap for integration & API tests.
 */
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

/**
 * Connects to MongoDB Memory Server and returns the Express app instance.
 */
async function startMemoryMongoAndApp() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || "jest-jwt-secret-min-32-chars-long";

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  // eslint-disable-next-line global-require
  return require("../../app");
}

async function clearAllCollections() {
  const cols = mongoose.connection.collections;
  await Promise.all(Object.values(cols).map((c) => c.deleteMany({})));
}

async function stopMemoryMongoAndApp() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

module.exports = {
  startMemoryMongoAndApp,
  clearAllCollections,
  stopMemoryMongoAndApp,
};
