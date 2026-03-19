const { formatEmailSendError } = require("../../utils/emailLog");

describe("emailLog", () => {
  describe("formatEmailSendError", () => {
    it("handles null", () => {
      expect(formatEmailSendError(null)).toContain("unknown");
    });

    it("includes message and SMTP fields when present", () => {
      const err = new Error("Connection timeout");
      err.code = "ETIMEDOUT";
      err.command = "CONN";
      err.responseCode = 421;
      err.response = "421 Service not available";
      const s = formatEmailSendError(err);
      expect(s).toMatch(/Connection timeout/);
      expect(s).toMatch(/ETIMEDOUT/);
      expect(s).toMatch(/CONN/);
      expect(s).toMatch(/421/);
    });
  });
});
