// Mock SMTP before any route loads voteController → avoids real network + verify()
jest.mock("../utils/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "mock-message-id" }),
}));
