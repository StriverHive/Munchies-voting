/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setupAfterEnv.js"],
  testTimeout: 120000,
  maxWorkers: 1,
  forceExit: true,
};
